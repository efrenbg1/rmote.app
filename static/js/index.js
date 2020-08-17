try {
    var tools = new Toolbox();
    tools.showLoading();
    feather.replace();
    var session = new Session();
    var ui = new UI({
        defaultPath: ["control"],
        activeClass: "active",
        dismissAnimation: function () {
            clearInterval(control.interval);
            if ($(window).width() <= 930) {
                tools.hide("navbar");
                tools.show("content");
                tools.hide("blank");
            }
            $('.modal').modal('hide');
            $('#grid')[0].setAttribute('class', 'slide-out');
        },
        welcomeAnimation: function () {
            $('#grid')[0].setAttribute('class', 'slide-in');
        },
        animationTime: 100,
        drawCallback: function () {
            tools.scrollTop();
            feather.replace();
        },
        onTitle: function (path) {
            return "lemonSW - " + ui.modules[path[0]].translation;
        },
        onSection: function () {
            var module = ui.section()[0];
            var icon = ui.modules[module].icon;
            var name = ui.modules[module].translation;
            document.getElementById("title").innerHTML = `<li class="breadcrumb-item active" aria-current="page"><p class="mb-0"><i data-feather="{}"></i>&nbsp;{}</p></li>`.format(icon, name);
            feather.replace();
            tools.scrollTop();
        },
        onInvalidURL: function () {
            tools.alert("The specified path was not found.", "git-pull-request", "warning");
        }
    });
    tools.hideLoading();
} catch (e) {
    console.log(e);
    $('#error').modal({
        backdrop: 'static',
        keyboard: false
    })
}