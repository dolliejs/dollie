import { Context } from '@dollie/core';
import inquirer from 'inquirer';

async function test() {
  const context = new Context('test', 'lenconda/template-react', {
    getTemplateProps: async (questions) => {
      return await inquirer.prompt(questions);
    },
  });
  await context.generate();
}

test();
