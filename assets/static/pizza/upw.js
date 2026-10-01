var real;
$(function() {
  var total = 0;
  var attempts = 0;

  $('.score').html('');
  get_next();

  function clicked(real, realreal) {
    attempts++;
    console.log(real);
    if (real) {
      total++;
      $('.score').html('Correct!');
    } else {
      $('.score').html('Wrong!');
    }
    
    // hahaha
    if (realreal)
      $('.article-link').html('That was real');
    else
      $('.article-link').html('That was fake');

    setTimeout(function() {
      $('.score').html('Score: ' + total + '/' + attempts);
    }, 1000);
    get_next();
  }
  $('.real-btn').click(function() { clicked( real, real); });
  $('.fake-btn').click(function() { clicked(!real, real); });
});

var prev_url;
function get_next() {
  $.getJSON('/upw.json', function(data) {
    var titles;
    if (Math.random() > 0.5) {
      real = true;
      titles = data['real'];
    } else {
      real = false;
      titles = data['fake'];
    }
    console.log(real);
    var article = titles[Math.floor(Math.random()*titles.length)];
    if (prev_url)
      $('.article-link').html('<a target="_" href="' + prev_url + '">' + $('.article-link').html() + '</a>');
    $('#article-title').html(article.text);
    prev_url = article.url;
  });
}
