# VRGPortalFirebase
Sample for interaction with VRT for Competition Portals.

requires the addition of .firebaserc file in the root folder. File should look something like this:

{
  "projects": {
    "default": "<Project ID Here>"
  }
}

User Projects endpoint is created at <cloudFunctionUrl>/userProjects.
Results endpoint is created at <cloudFunctionUrl>/submitResults.

All code is in /functions/index.js.
Change the three const values at the top of the program to suit your needs.
