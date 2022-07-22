var converter = new showdown.Converter({
    'tables': true,
    'tasklists': true,
    'strikethrough': true
})

var textarea = document.querySelector('textarea')

try{
    textarea.addEventListener('input', event => {
        var markdown = document.querySelector('textarea').value
        var html = converter.makeHtml(markdown)
        document.getElementById('markup').innerHTML = html
    })
} catch {
    var txt = document.querySelector('p[name="longDescription"]').innerText
    console.log(`text: ${txt}`)
    document.getElementById('markup').innerHTML  = converter.makeHtml(txt);
}

