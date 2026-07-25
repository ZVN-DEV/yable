---
'@zvndev/yable-core': patch
'@zvndev/yable-react': patch
'@zvndev/yable-themes': patch
'@zvndev/yable-vanilla': patch
---

Export `./package.json` from every package. `require.resolve('@zvndev/yable-react/package.json')`
previously threw `ERR_PACKAGE_PATH_NOT_EXPORTED`, which breaks common
version-introspection tooling.
