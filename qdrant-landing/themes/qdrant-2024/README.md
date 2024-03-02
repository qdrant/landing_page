## Building, transpiling and running the project

Project uses Hugo build-in pipes to transpile and minify assets.

Pre-requisites:
- Dart Sass 

### Install Dart Sass

You can [download](https://github.com/sass/dart-sass/releases/) a package for your OS from [Sass github](https://github.com/sass/dart-sass/releases/) and [add it to your PATH](https://www.google.com/search?q=add+path+variable).

Don't forget to restart your terminal after adding Dart Sass to your PATH.

#### Troubleshooting

Run the following commands:

```bash
hugo env | grep "dart-sass"

sass --embedded --version
```

And check that both commands output the same version of Dart Sass. If not, you may have several versions of Dart Sass installed on your system.

Don't forget to restart your terminal after adding Dart Sass to your PATH.

Don't use node-sass, it's incompatible.

