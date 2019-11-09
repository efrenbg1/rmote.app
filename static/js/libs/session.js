class Session{
    constructor() {
        this.templates = new sessionTemplates();
    }

    refresh() {
        try {
            tools.setCookie("Username", tools.getCookie("Username"), 5);
            tools.setCookie("Session", tools.getCookie("Session"), 5);
        } catch(e){
        }
    }

    logIn(){
        document.getElementById("obfuscator").classList.remove('is-visible');
        var user = document.getElementById("user").value;
        var pw = document.getElementById("pw").value;
        tools.hideDiag();
        tools.showLoading('profile');
        tools.req('/login', function (status, response) {
            tools.hideDiag();
            if (status === 200) {
                tools.setCookie("Username", response['Username'], 5);
                tools.setCookie("Session", response['Cookie'], 5);
                document.getElementById("username").innerText = tools.getCookie("Username");
                section.reconstruct();
            } else {
                this.showLogIn("Wrong credentials (" + status + ")");
            }
        }.bind(this), {'Username': tools.encodeSTR(user),'Password': tools.encodeSTR(pw)});
    }

    logOut() {
        clearInterval(tools.interval);
        tools.req('/logout', function(status, response){
            document.cookie = "Username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie = "Session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            this.showLogIn("Session closed");
        }.bind(this));
    }


    showLogIn(msg){
        clearInterval(tools.interval);
        if(document.getElementById('orrsDiag') === null) {
            document.getElementById("obfuscator").classList.add('is-visible');
            showDialog({
                text: this.templates.login.format(msg),
                cancelable: false,
                onLoaded: function () {
                    //updateMDL();
                },
            });
            window.addEventListener('keydown', this.enter, false);
        }
    }

    enter(e){
        if(e.keyCode === 13) {
            session.logIn();
            window.removeEventListener('keydown', session.enter, false);
        }
    }
}


class sessionTemplates {
    constructor() {
        this.login = `<center><img style="margin-left: auto;margin-right: auto;" height="150" width="150" src="icon/android-chrome-192x192.png">
    <p></p>
    <button class="mdl-button mdl-js-button mdl-button--primary">
    <i class="material-icons">announcement</i> {}
    </button></center><br>
    <div class="form">
    <form class="login-form">
    <input type="text" placeholder="username" id="user"/>
    <input type="password" placeholder="password" id="pw"/>
    <button onclick="session.logIn();" type="button">login</button>
    <p class="message">Not registered? <a href="/register.html">Create an account</a></p></form>`;
    }
}
