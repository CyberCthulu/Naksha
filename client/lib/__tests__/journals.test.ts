import supabase from '../supabase'
import {
  JournalUnavailableError,
  getOwnedJournal,
  insertJournal,
  updateJournal,
  type JournalRow,
} from '../journals'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

const EXISTING: JournalRow = {
  id: 99,
  user_id: 'user-1',
  chart_id: 42,
  prompt_template: 'guidance.prompt.attention',
  title: 'Original title',
  content: 'Original body',
  created_at: '2026-05-11T00:00:00.000Z',
  updated_at: '2026-05-12T00:00:00.000Z',
}

function mockSupabaseUser(userId = 'user-1') {
  const getUser = supabase.auth.getUser as unknown as jest.Mock
  getUser.mockResolvedValue({ data: { user: { id: userId } } })
}

function mockInsert(result: { data?: unknown; error?: unknown } = {}) {
  const response = {
    data: result.data ?? EXISTING,
    error: result.error ?? null,
  }
  const single = jest.fn().mockResolvedValue(response)
  const select = jest.fn(() => ({ single }))
  const insert = jest.fn(() => ({ select }))
  ;(supabase.from as unknown as jest.Mock).mockReturnValue({ insert })
  return { insert, select, single }
}

function mockUpdate(result: { data?: unknown; error?: unknown } = {}) {
  const response = {
    data: result.data === undefined ? EXISTING : result.data,
    error: result.error ?? null,
  }
  const maybeSingle = jest.fn().mockResolvedValue(response)
  const select = jest.fn(() => ({ maybeSingle }))
  const query: any = {
    eq: jest.fn(() => query),
    select,
  }
  const update = jest.fn(() => query)
  ;(supabase.from as unknown as jest.Mock).mockReturnValue({ update })
  return { update, query, select, maybeSingle }
}

function mockFetch(result: { data?: unknown; error?: unknown } = {}) {
  const response = {
    data: result.data === undefined ? EXISTING : result.data,
    error: result.error ?? null,
  }
  const maybeSingle = jest.fn().mockResolvedValue(response)
  const query: any = {
    eq: jest.fn(() => query),
    maybeSingle,
  }
  const select = jest.fn(() => query)
  ;(supabase.from as unknown as jest.Mock).mockReturnValue({ select })
  return { select, query, maybeSingle }
}

describe('journal writes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseUser()
  })

  it('inserts a new journal without accepting a client id', async () => {
    const query = mockInsert()

    await expect(
      insertJournal({
        title: 'New entry',
        content: 'Body',
        chart_id: 42,
        prompt_template: 'transit-reflection',
      })
    ).resolves.toEqual(EXISTING)

    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      chart_id: 42,
      prompt_template: 'transit-reflection',
      title: 'New entry',
      content: 'Body',
    })
    const [payload] = query.insert.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ]
    expect(payload).not.toHaveProperty('id')
  })

  it('uses null defaults only while creating a new journal', async () => {
    const query = mockInsert()

    await insertJournal({ content: 'Body' })

    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      chart_id: null,
      prompt_template: null,
      title: null,
      content: 'Body',
    })
  })

  it('updates only fields explicitly present in the patch', async () => {
    const updated = { ...EXISTING, content: 'Only the body changed' }
    const query = mockUpdate({ data: updated })

    await expect(
      updateJournal(99, { content: 'Only the body changed' })
    ).resolves.toEqual(updated)

    expect(query.update).toHaveBeenCalledWith({
      content: 'Only the body changed',
    })
    const [payload] = query.update.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ]
    expect(payload).not.toHaveProperty('chart_id')
    expect(payload).not.toHaveProperty('title')
    expect(payload).not.toHaveProperty('prompt_template')
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('user_id')
    expect(payload).not.toHaveProperty('created_at')
  })

  it('preserves metadata on a content-only edit', async () => {
    const updated = { ...EXISTING, content: 'Changed body' }
    mockUpdate({ data: updated })

    const result = await updateJournal(EXISTING.id, {
      content: 'Changed body',
    })

    expect(result).toEqual({
      ...EXISTING,
      chart_id: 42,
      title: 'Original title',
      prompt_template: 'guidance.prompt.attention',
      user_id: 'user-1',
      created_at: '2026-05-11T00:00:00.000Z',
      content: 'Changed body',
    })
  })

  it('allows explicit null only for nullable mutable fields', async () => {
    const query = mockUpdate({
      data: { ...EXISTING, chart_id: null, title: null },
    })

    await updateJournal(99, { chart_id: null, title: null })

    expect(query.update).toHaveBeenCalledWith({
      chart_id: null,
      title: null,
    })
  })

  it('rejects an empty update patch', async () => {
    await expect(updateJournal(99, {})).rejects.toThrow(
      'No journal changes were provided.'
    )
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('treats a deleted, missing, or inaccessible update as unavailable', async () => {
    mockUpdate({ data: null })

    await expect(
      updateJournal(99, { content: 'Still here' })
    ).rejects.toBeInstanceOf(JournalUnavailableError)
  })
})

describe('owned journal fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseUser()
  })

  it('loads one journal through both id and current-user filters', async () => {
    const query = mockFetch()

    await expect(getOwnedJournal(99)).resolves.toEqual(EXISTING)
    expect(query.query.eq).toHaveBeenNthCalledWith(1, 'id', 99)
    expect(query.query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    expect(query.maybeSingle).toHaveBeenCalled()
  })

  it('returns null for missing or RLS-hidden journals', async () => {
    mockFetch({ data: null })

    await expect(getOwnedJournal(99)).resolves.toBeNull()
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects malformed journal id %s before querying',
    async (id) => {
      await expect(getOwnedJournal(id)).rejects.toBeInstanceOf(
        JournalUnavailableError
      )
      expect(supabase.from).not.toHaveBeenCalled()
    }
  )
})
