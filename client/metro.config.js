// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname

const config = getDefaultConfig(projectRoot)

config.resolver.disableHierarchicalLookup = true
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]

// Force a single Three instance no matter how it's imported
const threePath = path.resolve(projectRoot, "node_modules/three");
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  three: threePath,
  // This is the key line for your case:
  "maath/three": threePath,
};

module.exports = config
