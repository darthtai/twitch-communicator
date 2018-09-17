const fs = require('fs');

module.exports = function() {
  const minigamesFilePath = './src/crons/minigames/';

  fs.readdir(minigamesFilePath, (err, files) => {
    console.log(err);
    console.log(files);
    files.forEach(file => {
      console.log(file);
      if (file.includes('.js')) {
        require(`./minigames/${file}`);
      }
    });
  });
}