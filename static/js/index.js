try {
    var tools = new Toolbox();
    tools.showLoading();
    feather.replace();
    var session = new Session();
    var nav = new Navigation();
} catch (e) {
    console.log(e);
    $('#error').modal({
        backdrop: 'static',
        keyboard: false
    })
}