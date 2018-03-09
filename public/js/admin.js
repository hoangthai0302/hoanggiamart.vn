$(document).ready(function(){
    $('.item-preview').click(function(){
       $(this).next().trigger('click');
    })

    $('#price, #price_final').keyup(function(){
        let price_final = $('#price_final').val() || 0;
        let price = $('#price').val() || 0;

        price_final = numberWithCommas(price_final) + 'đ';
        price = numberWithCommas(price) + 'đ';
        $('.price').html(price)
        $('.price_final').html(price_final)
    })
    
})

function extractImageName(path){
    if(path){
        var index = path.lastIndexOf('/');
        return path.substring(index + 1, path.length);
    }
    return '';
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
;}
