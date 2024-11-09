"use strict";

const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);
const cs = {};

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {

    console.log(file)
    console.log(__dirname)
    console.log(path.join(__dirname, file))

    const entity = require(path.join(__dirname, file));

    cs[entity.name] = entity;
  });

Object.keys(cs).forEach((entityName) => {
  if (cs[entityName].associate) {
    cs[entityName].associate(cs);
  }
});

module.exports = cs;
