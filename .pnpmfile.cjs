function readPackage(pkg) {
  delete pkg.peerDependenciesMeta;
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
