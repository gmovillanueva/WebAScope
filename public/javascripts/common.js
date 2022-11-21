function trackError(message, file, line){
	// console.log(message, line, file);
}

window.onerror = function(message, file, line){
	// trackError(message, line, file);
	ga('send', 'event', 'JavaScript Error', message, file + ": Line "+ line, { 'nonInteraction': 1 });
}

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
