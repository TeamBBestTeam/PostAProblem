

function validate()
{
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    if(username=="admin"&& password=="admin")
    {
        var location = window.location.href = "index.html";
        alert("Login Successful", location);
        
        return;
        // return false;
    }
    else
    {
        var fail = window.location.href = "login.html";
        alert("Login Failed", fail);
        return;
    }


}

//convert firebase authentication errors to more readable error messages
function getErrorMessage(errorMessage)

{
    //create map of error codes with corresponding value as message to be displayed/returned
    var map = {};
    map['auth/invalid-email'] = 'Please enter a valid email';
    map['auth/invalid-password'] = 'Password must be at least 6 characters';
    map['auth/wrong-password'] = 'Password is incorrect'
    map['auth/user-not-found'] = "Account with that email does not exist";
    map['auth/email-already-exists'] = "An account with that email already exists";


    return map[errorMessage];

}
