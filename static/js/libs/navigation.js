window.onhashchange = function(){
    section.browserBack();
};

class Navigation{
    constructor(){
        this.select("control");
    }

    select(id){
        this.section = id;
        this.reconstruct();
        document.getElementById("control").classList.remove('selected', 'mdl-color-text--blue-grey-800');
        document.getElementById("settings").classList.remove('selected', 'mdl-color-text--blue-grey-800');
        document.getElementById("manager").classList.remove('selected', 'mdl-color-text--blue-grey-800');
        var obfuscator = document.getElementsByClassName('is-visible');
        while(obfuscator.length > 0){
            obfuscator[0].classList.remove('is-visible');
        }
        document.getElementById(id).classList.add('selected','mdl-color-text--blue-grey-800');
        if(id === "control"){
            document.getElementById("title").innerText = "Control center";
        } else if(id === "manager"){
            document.getElementById("title").innerText = "Boards manager";
        } else if(id === "settings"){
            document.getElementById("title").innerText = "Account settings";
        }
    }

    reconstruct() {
        clearInterval(tools.interval);
        if (this.section === "control") {
            active = new Control();
        } else if (this.section === "manager") {
            active = new Manager();
        } else if (this.section === "settings") {
            active = new Settings();
        }
    }
}