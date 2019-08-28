class Settings{
    constructor(){
        this.templates = new settingsTemplates();
        document.getElementById("grid").innerHTML = this.templates.grid;
    }

    mail(){
        showDialog({
            title: 'Change email:',
            text: `<center><form action="#">
            <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <div class="popup">
            <span class="popuptext" id="valid">Please insert a valid email address</span></div>
            <input class="mdl-textfield__input" type="email" id="input-1" onkeyup="active.checkEmail()">
            <label class="mdl-textfield__label" for="sample1">New email</label>
            </div>
            <div class="mdl-textfield mdl-js-textfield">
            <div class="popup">
            <span class="popuptext" id="match">Emails don´t match</span></div>
            <input class="mdl-textfield__input" type="email" id="input-2" onkeyup="active.checkEmail()">
            <label class="mdl-textfield__label" for="sample1">Repeat</label>
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
  <form action="#">
    <div class="popup mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup1">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-1" onkeydown="active.checkPass()">
      <label id="input-1-text" class="mdl-textfield__label" for="sample1">Current password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup2">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <div class="popup">
        <span class="popuptext" id="popup2_old">Can´t be the same as your older password</span></div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeydown="active.checkPass()">
      <label id="input-2-text" class="mdl-textfield__label" for="sample1">New password</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield">
      <div class="popup">
        <span class="popuptext" id="popup3">Passwords don´t match</span></div>
      <input class="mdl-textfield__input" type="password" id="input-3" onkeydown="active.checkPass()">
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
        var email = document.getElementById('email').innerHTML;
        showDialog({
            title: 'Please confirm data to delete the account:',
            text: `<center>
  <form action="#">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup2">Wrong email address</span></div>
      <input class="mdl-textfield__input" type="email" id="input-1" onkeydown="active.checkDestroy()">
      <label class="mdl-textfield__label" for="sample1">Email</label>
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <div class="popup">
        <span class="popuptext" id="popup3">⮚ 8-20 characters<br>⮚ Contain only and at least one: uppercase, lowercase and number</span>
      </div>
      <input class="mdl-textfield__input" type="password" id="input-2" onkeydown="active.checkDestroy()">
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
                tools.hide("save");
            }
        });
    }


    updateEmail(){
        if (check_email() == 1) {
            var input_1 = document.getElementById("input-1").value;
            theUrl = '/action?id=' + encodeURIComponent(getCookie('user')) + '&type=email&new=' + input_1;
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", reqListener);
            oReq.open("GET", theUrl);
            oReq.send();
            alert("confirmation email has been sent");
        } else {
            alert("Something went wrong")
        }
        function reqListener () {
            var response = this.responseText;
            if(response === "Error"){
            }
            console.log(this.responseText);
        }
    }

    updatePassword(){
        if (check_pass() == 1) {
            var input_1 = document.getElementById("input-1").value;
            var input_2 = document.getElementById("input-2").value;
            theUrl = '/action?id=' + encodeURIComponent(getCookie('user')) + '&type=pass&old=' + input_1 + '&new=' + input_2;
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", reqListener);
            oReq.open("GET", theUrl);
            oReq.send()
            alert("confirmation email has been sent");
        } else {
            alert("Something went wrong")
        }
        function reqListener () {
            var response = this.responseText;
            if(response == "Error"){

            }
            console.log(this.responseText);
        }
    }

    destroyAccount(){
        if (check_destroy() == 1) {
            var input_1 = document.getElementById("input-1").value;
            var input_2 = document.getElementById("input-2").value;
            var theUrl = '/action?id=' + encodeURIComponent(getCookie('user')) + '&type=destroy&email=' + input_1 + '&pw=' + input_2;
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", reqListener);
            oReq.open("GET", theUrl);
            oReq.send()
            alert("confirmation email has been sent");
        } else {
            alert("Something went wrong")
        }
        function reqListener () {
            var response = this.responseText;
            if(response == "Error"){
            }
            console.log(this.responseText);
        }
    }


    checkEmail() {
        var email = document.getElementById("input-1");
        var email2 = document.getElementById("input-2");
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if(email.value) {
            if (!filter.test(email.value)) {
                tools.show("valid");
                tools.hide("match");
            } else {
                tools.hide("valid");
                if (email.value == email2.value) {
                    tools.show("save");
                    tools.hide("match");
                    return(1);
                } else {
                    tools.show("match");
                }
            }
        } else {
            tools.hide("match");
            tools.hide("valid");
        }
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
                            return(1);
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
    }

    checkDestroy() {
        var email = document.getElementById("input-1");
        var pw = document.getElementById("input-2");
        var filter_email = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        var filter_pw = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,20})$/;
        if(email.value) {
            if (document.getElementById('email').innerHTML != email.value) {
                tools.show("popup2");
                tools.hide("popup3");
                tools.hide("delete");
            } else if (document.getElementById('email').innerHTML == email.value) {
                tools.hide("popup2");
                tools.hide("delete");
                if (pw.value) {
                    if (!filter_pw.test(pw.value)) {
                        tools.show("popup3");
                    } else {
                        tools.show("delete");
                        tools.hide("popup3");
                        return (1);
                    }
                }
            }
        } else {
            tools.hide("popup1");
            tools.hide("popup2");
            tools.hide("popup3");
            tools.hide("delete");
        }
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
                <button style="background-color: Transparent; background-repeat:no-repeat; border: none; cursor:pointer; outline:none;" onclick="alert('On development');">

                    <i class="material-icons" style="position: center; transform:translateY(70%); font-size:70px;">alarm_off</i>
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