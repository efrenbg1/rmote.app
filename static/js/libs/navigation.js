window.addEventListener('popstate', function (event) {
    if (event.state == undefined || event.state.session !== nav.session || document.getElementById('login').style.display == "block") {
        window.history.forward();
        return;
    }
    nav.mainID = nav.section()[0];
    nav.main = nav.modules[nav.mainID];
    tools.animationTime = performance.now();
    $('#grid')[0].setAttribute('class', 'slide-out');
    setTimeout(function () {
        nav.reconstruct();
    }, 100);
    nav.order = event.state.order;
    nav.old = nav.section();
    nav.force = false;
    nav.title(event.state.title);
    document.title = event.state.nav;
});

class Navigation {
    constructor() {
        this.page = 1;
        this.grid = document.getElementById("grid");
        this.old = [];
        this.order = 0;
        this.session = Math.random();
        this.force = false;
        this.steps = 0;
        this.modules = {};
        this.mainID = "control";
    }

    section() {
        var location = window.location.pathname.substring(1).split("/");
        if (location[location.length - 1] === "") {
            location.pop();
        }
        return location;
    }

    reconstruct() {
        clearInterval(control.interval);
        if (this.order === 0) {
            if (this.section().length === 0) {
                this.setSection(this.mainID);
            } else {
                this.setSection(this.section()[0]);
            }
        }
        this.select(this.section()[0]);
        this.old = this.section();
        this.mainID = this.section()[0];
        this.main = this.modules[this.section()[0]];
        $('.modal').modal('hide');
        document.getElementById("grid").innerHTML = "";
        this.main.class().list();
    }

    select(id) {
        var all = document.getElementsByClassName("active");
        while (all.length > 0) {
            all[0].classList.remove("active");
        }
        var sel = document.getElementById(id);
        sel.classList.add("active");
    }

    load(id) {
        this.setSection(id);
        tools.animationTime = performance.now();
        $('#grid')[0].setAttribute('class', 'slide-out');
        setTimeout(function () {
            this.reconstruct();
        }.bind(this), 100);
        if (document.getElementById("content").style.display === "none") {
            tools.hideNavbar();
        }
    }

    setSection(section) {
        this.order++;
        var url = window.location.origin + "/" + section;
        var icon = this.modules[section].icon;
        var name = this.modules[section].name;
        var title = `<li class="breadcrumb-item active" aria-current="page"><p class="mb-0"><i data-feather="{}"></i>&nbsp;{}</p></li>`.format(icon, name);
        history.pushState({
            prev: this.old,
            order: this.order,
            session: this.session,
            title: title,
            nav: "lemonSW - " + name
        }, "", url);
        this.title(title);
        document.title = "lemonSW - " + name;
    }

    title(string) {
        document.getElementById("title").innerHTML = string;
        try {
            feather.replace();
        } catch (e) {
            console.log(e);
        }
    }
}