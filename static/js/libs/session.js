class Session {
    constructor() {
        this.templates = new sessionTemplates();
    }

    refresh() {
        try {
            tools.setCookie("Username", tools.getCookie("Username"), 5);
            tools.setCookie("Session", tools.getCookie("Session"), 5);
        } catch (e) {
        }
    }

    check() {
        if (tools.getCookie("Session") === undefined || tools.getCookie("Username") === undefined) return false;
        return true;
    }

    showLogIn(icon, msg, type) {
        $('.modal').modal('hide');
        var login_msg = document.getElementById("login_msg");
        login_msg.innerHTML = `<i data-feather="{}"></i>&nbsp;`.format(icon) + msg;
        login_msg.classList = "text-center alert my-2 " + type;
        $('#login').modal({
            backdrop: 'static',
            keyboard: false
        });
        feather.replace();
        //window.addEventListener('keydown', session.enter, false);
    }

    LogIn() {
        var user = document.getElementById("user").value;
        var pw = document.getElementById("pw").value;
        tools.showModal('logging');
        tools.req('/login', function (status, response) {
            tools.hideModal('logging');
            if (status === 200) {
                tools.hideModal("login");
                tools.setCookie("Username", response['username'], 5);
                tools.setCookie("Session", response['cookie'], 5);
                nav.reconstruct();
                document.getElementById("user").value = "";
                document.getElementById("pw").value = "";
                window.removeEventListener('keydown', session.enter, false);
                // TODO añadir nombre de usuario conectado como antes
            } else if (status != 205) {
                this.showLogIn("alert-triangle", "Wrong e-mail/password (" + status + ")", "alert-danger");
            }
        }.bind(this), { 'user': tools.encodeSTR(user), 'pw': tools.encodeSTR(pw) });
        tools.hideLoading();
    }

    logOut() {
        clearInterval(tools.interval);
        tools.req('/logout', function (status, response) {
            document.cookie = "Username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie = "Session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            tools.showLogIn("Session closed");
        }.bind(this));
    }

    enter(e) {
        if (e.keyCode === 13) {
            session.logIn();
            window.removeEventListener('keydown', session.enter, false);
        }
    }
}


class sessionTemplates {
    login() {
        return `<center>
    <img style="margin-left: auto;margin-right: auto;" height="150" width="150" src="icon/android-chrome-192x192.png">
    <p></p>
    <button class="mdl-button mdl-js-button mdl-button--primary">
        <i class="material-icons">announcement</i> {}
    </button>
</center>
<br>
<div class="form">
    <form class="login-form">
        <input type="text" placeholder="username" id="user" />
        <input type="password" placeholder="password" id="pw" />
        <button onclick="session.logIn();" type="button">login</button>
        <p class="message">Not registered? <a href="/register.html">Create an account</a></p>
    </form>
</div>
<div class="hr-sect">
    <span class="mdl-layout-title">Don't have a board?</span>
</div>
<br>
<center>
    <p class="message">Boards can be purchased via PayPal</p>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent" onclick="location.href='/buy.html'">
        <i class="material-icons">shopping_cart</i> Buy now
    </button>
</center>
<br>`;
    }
}