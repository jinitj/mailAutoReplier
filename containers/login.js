module.exports = {
    redirectUser : (req,res) => {
        res.redirect('http://localhost:3000/oauth/authorize');
    }
}