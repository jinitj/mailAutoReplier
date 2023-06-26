
STEPS TO LAUNCH THE CODE:

1 .FIRST RUN NPM INSTALL 
2. THERE IS A LAUNCH.JSON FILE ALREADY PRESENT IN THE REPO YOU JUST NEED TO GO TO THE DEBUGGER OPTIONS AND THEN CLICK ON LAUNCH PROGRAM
3. THE APP WILL RUN ON LOCALHOST:3000
4. IN THE BROWSER HIT HTTP://LOCALHOST:3000 AND YOU WILL BE REDIRECTED TO GOOGLES LOGIN PAGE
5. AFTER THIS LOGIN INTO YOUR GOOGLE ACCOUNT ,AFTER THIS APPROVE THE PERMISSIONS ASKED IN ORDER TO RUN THE APP
6. THEN YOU WILL BE REDIRECTED TO HOMEPAGE , THERE IS A HYPERLINK ON THE HOMEPAGE ,IF YOU WANT TO ENJOY VACCATION MODE HIT THE HYPERLINK
7. NOW THE SYSTEM WILL REPLY TO ALL APPROPRIATE MESSAGES ON YOUR BEHALF





///ABOUT THE APP
conditions: 

1. Reply only to fresh mail threads i.e. threads in which no mail has been replied by the user 
2. Implement login using gmail apis
3. Move mails to appropriate labels
4. if labels not present create them
5. Repeat steps 1-4 in an interval of 45-120 seconds , 



-> At the very initial step the user accesses the system by visiting the landing page 
->  On visiting the landing page the user is automatically taken to google oauth login page 
-> User is asked to approve the permissions asked by the app followed by loggin in the system 
-> Users access and refresh tokens are generated
-> We use this access and refresh token to retrieve users email and send emails on behalf of user 
-> In the process of fetching and sending mails multiple things happen 
-> Every 100 seconds the system rechecks for any new mail 
-> That could have arrived in the past 120 seconds 
-> After going throught this the system checks if this is a fresh thread started by the sender if yes then the system replies to the sender on the users behalf
-> After this the mail is sent to the appropriate label

Libraries used:

express
axios

//not used in the main app
@google-cloud/local-auth
googleapis



