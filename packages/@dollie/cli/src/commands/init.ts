import commander from 'commander';

export default () => {
  const command = new commander.Command('init');

  command
    .description('Init a project with an appropriate template')
    .arguments('[template] [name]')
    .action(async (template: string, name: string) => {
    });

  return command;
};
