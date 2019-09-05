class Settings{
    constructor(){
        this.templates = new settingsTemplates();
        document.getElementById("grid").innerHTML = this.templates.grid;
    }

    mail(){
        showDialog({
            title: 'Change email:',
            text: `<center><form action="javascript:" autocomplete="off">
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <div class="popup">
            <span class="popuptext" id="valid">Please insert a valid email address</span></div>
            <input class="mdl-textfield__input" type="email" id="input-1" onkeyup="active.checkEmail()" autocomplete="false">
            <label class="mdl-textfield__label" for="sample1">New email</label>
            </div>
            <div class="mdl-textfield mdl-js-textfield">
            <div class="popup">
            <span class="popuptext" id="match">Emails don´t match</span></div>
            <input class="mdl-textfield__input" type="email" id="input-2" onkeyup="active.checkEmail()">
            <label class="mdl-textfield__label" for="sample1">Repeat</label>
            </div>
            <div class="mdl-textfield mdl-js-textfield">
            <div class="popup">
            <span class="popuptext" id="pw">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
            </div>
            <input class="mdl-textfield__input" type="password" id="input-3" onkeyup="active.checkEmail()" autocomplete="new-password">
            <label class="mdl-textfield__label" for="input-3">Confirm password</label>
            </div>
            </form></center>`,
            positive: {
                title: '<h style="color:green;">Save</h>',
                id: 'save',
                onClick: function() {active.updateEmail();}
            },
            negative: {
                title: '<h style="color:red;" disabled>Cancel</h>'
            },
            onLoaded: function() {
                tools.hide("save");
            }
        });
    }

    password(){
        showDialog({
            title: 'Change password:',
            text: `<center>
  <form action="javascript:" autocomplete="off">
    <div class="popup mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup1">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-1" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-1-text" class="mdl-textfield__label" for="sample1">Current password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup2">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <div class="popup">
        <span class="popuptext" id="popup2_old">Can´t be the same as your older password</span></div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-2-text" class="mdl-textfield__label" for="sample1">New password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup3">Passwords don´t match</span></div>
      <input class="mdl-textfield__input" type="password" id="input-3" onkeyup="active.checkPass()" autocomplete="new-password">
      <label id="input-3-text" class="mdl-textfield__label" for="sample1">Repeat</label>
    </div>
  </form>
</center>`,
            positive: {
                title: '<h style="color:green;">Save</h>',
                id: 'save',
                onClick: function() {active.updatePassword();}
            },
            negative: {
                title: '<h style="color:red;" disabled>Cancel</h>'
            },
            onLoaded: function() {
                tools.hide("save");
                tools.hide("popup1");
            }
        });
    }

    destroy(){
        showDialog({
            title: 'Please confirm data to delete the account:',
            text: `<center>
  <form action="javascript:" autocomplete="off">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup2">Wrong email address</span></div>
      <input class="mdl-textfield__input" type="text" id="input-1" onkeyup="active.checkDestroy()" autocomplete="false">
      <label class="mdl-textfield__label" for="sample1">Email</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup3">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeyup="active.checkDestroy()" autocomplete="new-password">
      <label class="mdl-textfield__label" for="sample1">Password</label>
    </div>
  </form>
</center>`,
            positive: {
                title: '<h style="color:red;">Delete</h>',
                id: 'delete',
                onClick: function() {active.destroyAccount();}
            },
            negative: {
                title: '<h style="color:green;" disabled>Cancel</h>'
            },
            onLoaded: function() {
                tools.hide("delete");
            }
        });
    }


    updateEmail() {
        if (this.checkEmail()) {
            var input_1 = document.getElementById("input-1").value;
            var input_3 = document.getElementById("input-3").value;
            tools.req('/settings/email', function (status, response) {
                if (status === 200) {
                    alert("E-mail has been changed! Reloading session...");
                    session.logOut();
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), {'new': tools.encodeSTR(input_1), 'pw': tools.encodeSTR(input_3)});
        }
    }

    updatePassword() {
        if (this.checkPass()) {
            var input_1 = document.getElementById("input-1").value;
            var input_2 = document.getElementById("input-2").value;
            tools.req('/settings/password', function (status, response) {
                if (status === 200) {
                    alert("Password succesfully changed");
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), {'pw': tools.encodeSTR(input_1), 'new': tools.encodeSTR(input_2)});
        }
    }

    destroyAccount() {
        if (this.checkDestroy()) {
            var input_2 = document.getElementById("input-2").value;
            tools.req('/settings/destroy', function (status, response) {
                if (status === 200) {
                    alert("Account succesfully deleted");
                    session.logOut();
                } else {
                    tools.snack("Something went wrong")
                }
            }.bind(this), {'pw': tools.encodeSTR(input_2)});
        }
    }


    checkEmail() {
        var email = document.getElementById("input-1").value;
        var email2 = document.getElementById("input-2").value;
        var pw = document.getElementById("input-3").value;
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var filter2 = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if(email) {
            if (!filter.test(email)) {
                tools.show("valid");
                tools.hide("match");
                tools.hide("pw");
            } else {
                tools.hide("valid");
                if (email == email2) {
                    if(!filter2.test(pw)){
                        tools.show("pw");
                        tools.hide("match");
                    } else {
                        tools.show("save");
                        tools.hide("match");
                        tools.hide("pw");
                        return true;
                    }
                } else {
                    tools.show("match");
                    tools.hide("pw");
                }
            }
        } else {
            tools.hide("match");
            tools.hide("valid");
            tools.hide("pw");
        }
        return false;
    }

    checkPass() {
        var input_1 = document.getElementById("input-1");
        var input_2 = document.getElementById("input-2");
        var input_3 = document.getElementById("input-3");
        var input_1_text = document.getElementById("input-1-text");
        var input_2_text = document.getElementById("input-2-text");
        var input_3_text = document.getElementById("input-3-text");
        var filter = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if(input_1.value) {
            if (!filter.test(input_1.value)) {
                tools.show("popup1");
                tools.hide("save");
                tools.hide("popup3");
                tools.hide("popup2");
                tools.hide("popup2_old");
            } else {
                tools.hide("popup1");
                tools.hide("popup2_old");
                if(input_2.value) {
                    if (!filter.test(input_2.value)) {
                        tools.show("popup2");
                        tools.hide("save");
                        tools.hide("popup3");
                    } else if(input_2.value == input_1.value){
                        tools.hide("save");
                        tools.hide("popup3");
                        tools.hide("popup2");
                        tools.show("popup2_old");
                    } else {
                        tools.hide("popup2");
                        if (input_2.value == input_3.value) {
                            tools.show("save");
                            tools.hide("popup3");
                            return true;
                        } else {
                            tools.show("popup3");
                            tools.hide("save");
                        }
                    }
                } else {
                    tools.hide("save");
                    tools.hide("popup2");
                }
            }
        }  else {
            tools.hide("save");
            tools.hide("popup1");
        }
        return false;
    }

    checkDestroy() {
        var email = document.getElementById("input-1");
        var pw = document.getElementById("input-2");
        var filter_email = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var filter_pw = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if(tools.getCookie('Username') == ""){
            session.logIn("Session expired");
        }
        if(email.value) {
            console.log(email.value);
            console.log(tools.getCookie('Username'));
            if (tools.getCookie('Username') != email.value) {
                tools.show("popup2");
                tools.hide("popup3");
                tools.hide("delete");
            } else if (tools.getCookie('Username') == email.value) {
                tools.hide("popup2");
                tools.hide("delete");
                if (pw.value) {
                    if (!filter_pw.test(pw.value)) {
                        tools.show("popup3");
                    } else {
                        tools.show("delete");
                        tools.hide("popup3");
                        return true;
                    }
                }
            }
        } else {
            tools.hide("popup2");
            tools.hide("popup3");
            tools.hide("delete");
        }
        return false;
    }
}


class settingsTemplates{
    constructor(){
        this.grid = `<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">

        <center>
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded" data-upgraded=",MaterialTextfield">

                <button style="background-color: Transparent; background-repeat:no-repeat; border: none; cursor:pointer; outline:none;" onclick="active.mail();">
                    <i class="material-icons" style="position: center; transform:translateY(70%); font-size:70px;">email</i>
                </button>
            </div>
        </center>
    </div>
</div>

<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">

        <center>
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded" data-upgraded=",MaterialTextfield">
                <button style="background-color: Transparent; background-repeat:no-repeat; border: none; cursor:pointer; outline:none;" onclick="active.password();">

                    <i class="material-icons" style="position: center; transform:translateY(70%); font-size:70px;">fingerprint</i>
                </button>
            </div>
        </center>
    </div>
</div>

<div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">
    <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">

        <center>
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label is-dirty is-upgraded" data-upgraded=",MaterialTextfield">
                <button style="background-color: Transparent; background-repeat:no-repeat; border: none; cursor:pointer; outline:none;" onclick="active.destroy();">

                    <i class="material-icons" style="position: center; transform:translateY(70%); font-size:70px;">delete</i>
                </button>
            </div>
        </center>
    </div>
</div>

<div id="demo-toast-example" class="mdl-js-snackbar mdl-snackbar">
    <div class="mdl-snackbar__text"></div>
    <button class="mdl-snackbar__action" type="button"></button>
</div>`;
    }
}