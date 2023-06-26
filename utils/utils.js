
module.exports = {
    checkIfTokenExpired : (tokenExpiry,tokenCreationTime) => {
        
        const currentTime = Date.now() / 1000;
        const remainingTime = Math.floor(currentTime-tokenCreationTime);
        if (tokenExpiry < remainingTime) {
          // Token has expired
          return true;
        }
      
        // Token is still valid
        return false;
      },

      
}