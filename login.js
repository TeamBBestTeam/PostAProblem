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