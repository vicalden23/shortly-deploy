module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      // options: {
      //   separator: ';',
      // },
      dist: {
        src: ['public/client/app.js',
              'public/client/createLinkView.js',
              'public/client/link.js',
              'public/client/links.js',
              'public/client/linksView.js',
              'public/client/linkView.js',
              'public/client/router.js'],

        dest: 'public/dist/built.js',
      },
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    },

    nodemon: {
      dev: {
        script: 'server.js'
      }
    },

    uglify: {
      my_target: {
        files: {
          'public/dist/output.min.js': ['public/dist/built.js']
        }
      }
    },

    concurrent: {
      target: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    eslint: {
      target: [
        // Add list of files to lint here
        'public/dist/built.js'
      ]
    },

    cssmin: {
    },

    watch: {
      scripts: {
        files: [
          'public/client/*.js',
          'public/lib/**/*.js',
        ],
        tasks: [
          'concat',
          'uglify',
          'eslint',
          'mochaTest'
        ]
      },
      css: {
        files: 'public/*.css',
        tasks: ['cssmin']
      }
    },

    shell: {
      prodServer: {
        command: 'git push live master'
      }
    },
  });
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('server-dev', function (target) {
    grunt.task.run([ 'concurrent' ]);
    // grunt.task.run([ 'watch', 'nodemon' ]);
  });

  ////////////////////////////////////////////////////
  // Main grunt tasks
  ////////////////////////////////////////////////////

  grunt.registerTask('test', [
    'mochaTest'
  ]);

  grunt.registerTask('build', ['concat', 'uglify', 'eslint', 'mochaTest'
  ]);

  grunt.registerTask('upload', function(n) {
    if (grunt.option('prod')) {
      grunt.task.run(['shell:prodServer']);
    } else {
      grunt.task.run([ 'server-dev' ]);
    }
  });

  grunt.registerTask('deploy', ['build', 'upload']);

};
