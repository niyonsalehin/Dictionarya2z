  $(document).ready(function(){
  $("#open").click(function(){
    $("#full-popup").slideDown("slow");
  });
});


$(document).ready(function(){
  $(".popup-close").click(function(){
    $("#full-popup, .words").slideUp("slow");
  });
});



// words show

$(document).ready(function(){
  $("#auto_check, #popup_auto_check").click(function(){
    $(".words, .popup-words").slideDown();
  });
});


$(document).ready(function(){
  $(".word").click(function(){
    $(".words").slideUp();
  });
});



// jason data
var data = [];
$.getJSON('/assact/js/jsondata.json',function(result){
  $.each(result.entries, function(index, val){
    data.push(val);
  });
});
// console.log(data)

      $( "#auto_check" ).autocomplete({
        source: data
      });
