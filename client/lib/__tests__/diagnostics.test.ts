import { safeErrorDiagnostic } from '../diagnostics'

describe('safeErrorDiagnostic', () => {
  it('keeps only a safe code and message from a PostgREST error', () => {
    expect(
      safeErrorDiagnostic({
        code: '23505',
        message: 'Duplicate row',
        details: 'Key (birth_date)=(private value) already exists.',
        hint: 'Private database hint',
        chart_data: { private: true },
      })
    ).toEqual({ code: '23505', message: 'Duplicate row' })
  })

  it('uses a fixed fallback for values without safe diagnostic fields', () => {
    expect(safeErrorDiagnostic('private raw error')).toEqual({
      message: 'Unknown error',
    })
  })
})
