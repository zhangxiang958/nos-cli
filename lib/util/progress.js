const stdout = require('single-line-log').stdout;

function Progress(title = '进度', length = 50){
    this.title = title;
    this.length = length;

    this.render = function(opts){
        const percent = (opts.done / opts.total).toFixed(2);
        const bar_num = Math.floor(percent * this.length);
        let bar = ['['];
        for(let i = 0; i < bar_num; i ++) {
            bar.push('=');
        }
        (percent < 1) && (bar.push('>'));
        for(let i = 0; i < this.length - bar_num; i++) {
            bar.push('_');
        }
        bar.push(']');
        stdout(`${title}: ${percent * 100}% ${bar.join('')} ${opts.done}/${opts.total}`);
    };
};

module.exports = Progress;