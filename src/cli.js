const inquirer = require('inquirer')
const chalk = require('chalk')

module.exports = (title, options) => {
  console.log(chalk.bgMagenta(`${title} 的检索结果`))
  const question = [{
    type: 'list',
    name: 'index',
    message: '请选择：',
    choices: options,
  }]
  return inquirer.prompt(question).then(d => d.index)
}