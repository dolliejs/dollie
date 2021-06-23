import { Context } from '@dollie/core';
import inquirer from 'inquirer';

async function test() {
  const context = new Context('test', 'lenconda/template-react', {
    generator: {
      getTemplateProps: async (questions) => {
        return await inquirer.prompt(questions);
      },
      loader: {
        httpProxyUrl: 'http://127.0.0.1:7890',
      },
    },
  });
  await context.generate();
}

test();
