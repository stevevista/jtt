module.exports = function (grunt) {
    const BUILD = "dist/public",
        JSTMP = "./_babel",
        SRC = "src/web",
        CleanCSS = require('clean-css');
    // 构建任务配置
    grunt.initConfig({
        //读取package.json的内容，形成个json数据
        pkg: {},
        clean: {
            build: [JSTMP]
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: SRC,
                    src: ['**/*.*', '!**/*.js', '!**/*.css', '!**/*.html'],
                    dest: BUILD
                }]
            }
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['babel-preset-es2015']

            },
            dist: {
                files: [{
                    expand: true,
                    cwd: SRC, //js目录下
                    src: ['**/*.js', "!Gruntfile.js"], //所有js文件
                    dest: JSTMP //输出到此目录下
                }]
            }
        },
        uglify: {
            options: {
                report: "min",////输出压缩率，可选的值有 false(不输出信息)，gzip
                mangle: true,//混淆变量名
                preserveComments: false,//删除全部注释，还可以为 'all'（不删除注释），'some'（保留@preserve @license @cc_on等注释）
                compress: {
                    unsafe :true,
                    dead_code:true,//删除无法访问的代码
                    drop_console: true,//删除console
                    drop_debugger:true,//删除debugger;语句
                    join_vars:true,// 连接连续var语句
                }
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: JSTMP,
                    src: ['**/*.js'],
                    dest: BUILD
                }]
            }
        },
        cssmin: {
            options: {
                keepSpecialComments: 0,
                report: 'gzip'
            },
            prod: {
                expand: true,
                cwd: SRC,
                src: ['**/*.css'],
                dest: BUILD
            }
        },
        htmlmin: {
            options: {
                minifyCSS(style) {
                    var options = { /* options */ };
                    var output = new CleanCSS(options).minify(style);
                    return output.styles;
                },
                minifyJS: true,
                removeComments: true, //移除注释
                removeCommentsFromCDATA: true,//移除来自字符数据的注释
                collapseWhitespace: true,//无用空格
                collapseBooleanAttributes: true,//失败的布尔属性
                //removeAttributeQuotes: true,//移除属性引号      有些属性不可移走引号
                //removeRedundantAttributes: true,//移除多余的属性
                useShortDoctype: true,//使用短的跟元素
                //removeEmptyAttributes: true,//移除空的属性
                removeOptionalTags: true//移除可选附加标签
            },
            yasuo: {
                expand: true,
                cwd: SRC,
                src: ['**/*.html'],
                dest: BUILD
            }
        }
    });
    console.log(__dirname);
    // 加载指定插件任务
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // 默认执行的任务
    grunt.registerTask('default', ['copy', 'babel', 'uglify', 'cssmin', 'htmlmin', 'clean']);
};