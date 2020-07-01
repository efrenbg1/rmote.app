class Session {
    constructor() {
        if (this.check()) $('#account')[0].innerText = tools.getCookie("Username");
    }

    refresh() {
        try {
            tools.setCookie("Username", tools.getCookie("Username"), 5);
            tools.setCookie("Session", tools.getCookie("Session"), 5);
        } catch (e) {
        }
    }
    // TODO poner refresh para evitar que se cierre la sesión

    check() {
        if (tools.getCookie("Session") === undefined || tools.getCookie("Username") === undefined) {
            $('#account')[0].innerText = '';
            return false;
        }
        return true;
    }

    showLogIn(icon, msg, type) {
        clearInterval(control.interval);
        $('.modal').modal('hide');
        var login_msg = document.getElementById("login_msg");
        login_msg.innerHTML = `<i data-feather="{}"></i>&nbsp;`.format(icon) + msg;
        login_msg.classList = "text-center mb-2 text-" + type;
        $('#login').modal({
            backdrop: 'static',
            keyboard: false
        });
        feather.replace();
        window.addEventListener('keydown', session.enter, false);
    }

    LogIn() {
        var user = document.getElementById("user").value;
        var pw = document.getElementById("pw").value;
        tools.hideModal("login");
        tools.showModal('logging');
        window.removeEventListener('keydown', session.enter, false);
        tools.req('/login', function (status, response) {
            tools.hideModal('logging');
            if (status === 200) {
                // DONE Ocultar el modal de inicio de sesión mientras sale el logging
                tools.setCookie("Username", response['username'], 5);
                tools.setCookie("Session", response['cookie'], 5);
                nav.reconstruct();
                document.getElementById("user").value = "";
                document.getElementById("pw").value = "";
                $('#account')[0].innerText = response['username'];
            } else if (status != 205) {
                this.showLogIn("alert-triangle", "Wrong e-mail/password (" + status + ")", "danger");
            }
        }.bind(this), { 'user': tools.encodeSTR(user), 'pw': tools.encodeSTR(pw) });
        tools.hideLoading();
    }

    LogOut() {
        clearInterval(control.interval);
        tools.req('/logout', function (status, response) {
            document.cookie = "Username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie = "Session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            this.showLogIn("check", "Session closed", "success");
            $('#account')[0].innerText = '';
        }.bind(this));
    }

    enter(e) {
        if (e.keyCode === 13) {
            session.LogIn();
        }
    }
}