try {
    var tools = new Toolbox();
    tools.showLoading();
    feather.replace();
    var session = new Session();
    var nav = new Navigation();
} catch (e) {
    console.log(e);
    // TODO Traducir modal de error
    $('#error').modal({
        backdrop: 'static',
        keyboard: false
    })
}