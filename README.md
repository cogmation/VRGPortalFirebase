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


This SOFTWARE PRODUCT is provided by THE PROVIDER "as is" and "with all faults." THE PROVIDER makes no representations or warranties of any kind concerning the safety, suitability, lack of viruses, inaccuracies, typographical errors, or other harmful components of this SOFTWARE PRODUCT. There are inherent dangers in the use of any software, and you are solely responsible for determining whether this SOFTWARE PRODUCT is compatible with your equipment and other software installed on your equipment. You are also solely responsible for the protection of your equipment and backup of your data, and THE PROVIDER will not be liable for any damages you may suffer in connection with using, modifying, or distributing this SOFTWARE PRODUCT. 
