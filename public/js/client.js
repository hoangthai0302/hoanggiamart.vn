
function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
        return uri + separator + key + "=" + value;
    }
}

function filter(key, value) {
    console.log(key + ',' + value)
    let currentUrl = window.location.href;
    let newUrl = updateQueryStringParameter(currentUrl, key, value);
    window.location.href = newUrl;

}

$(".brand-filter .cb-brand").change(function () {
    let brandQuery = '';
    $('.brand-filter .cb-brand:checked').each(function () {
        let value = $(this).val();
        brandQuery += 'b' + value;
    })
    
    if (brandQuery) {
        filter('brand', brandQuery);
    }else{
        window.location.href = window.location.href.split("?")[0];

    }
});

$('.btn-search').click(() => {
    let keyword = $('#input_search').val() || '';
    if (keyword) {
        window.location.href = '/tim-kiem?text=' + encodeURIComponent(keyword);
    }

})

$('#input_search').keypress(function (e) {
    var key = e.which;
    if (key == 13) // the enter key code
    {
        let keyword = $('#input_search').val() || '';
        if (keyword) {
            window.location.href = '/tim-kiem?text=' + encodeURIComponent(keyword);
        }
    }
});
$('.input-search').keypress(function (e) {
    var key = e.which;
    if (key == 13) // the enter key code
    {
        let keyword = $('.input-search').val() || '';
        if (keyword) {
            window.location.href = '/tim-kiem?text=' + encodeURIComponent(keyword);
        }
    }
});

function slugify(str, separator) {
    separator = separator || '-';
    str = str.toLowerCase();
    str = str.replace(/[^a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
    str = str.trim();
    str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
    str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
    str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
    str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
    str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
    str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
    str = str.replace(/(đ)/g, 'd');
    str = str.replace(/ /g, '-');
    str = str.replace(/(-+)/g, separator);
    return str;

}




