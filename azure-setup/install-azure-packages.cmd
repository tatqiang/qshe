@echo off 
echo Installing Azure packages for QSHE PWA... 
 
echo Installing Azure MSAL packages... 
npm install @azure/msal-browser @azure/msal-react 
 
echo Installing Azure Storage package... 
npm install @azure/storage-blob 
 
echo Installing Azure Identity package... 
npm install @azure/identity 
 
echo Azure packages installed successfully! 
pause 
