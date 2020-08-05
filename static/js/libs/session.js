class Session {
    constructor() {
        if (this.refresh()) $('#account')[0].innerText = tools.getCookie("Username");
    }

    refresh() {
        if (tools.getCookie("Session") === undefined || tools.getCookie("Username") === undefined) {
            $('#account')[0].innerText = '';
            this.showLogIn('message-square', 'Login to continue', 'info');
            return false;
        }
        tools.setCookie("Username", tools.getCookie("Username"), 5);
        tools.setCookie("Session", tools.getCookie("Session"), 5);
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
        window.addEventListener('keydown', this.enter, false);
    }

    LogIn() {
        var user = document.getElementById("user").value;
        var pw = document.getElementById("pw").value;
        tools.hideModal("login");
        tools.showModal('logging');
        window.removeEventListener('keydown', this.enter, false);
        tools.req('/login', function (status, response) {
            tools.hideModal('logging');
            if (status === 200) {
                tools.setCookie("Username", response['username'], 5);
                tools.setCookie("Session", response['cookie'], 5);
                ui.reconstruct();
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
            if (status != 200) tools.showFailure(status);
            this.showLogIn("check", "Session closed", "success");
        }.bind(this), {
            'Username': tools.getCookie('Username'),
            'Session': tools.getCookie('Session')
        });
        document.cookie = "Username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "Session=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        $('#account')[0].innerText = '';
    }

    enter(e) {
        if (e.keyCode === 13) {
            this.LogIn();
        }
    }
}