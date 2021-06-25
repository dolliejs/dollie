import commander from 'commander';

export default () => {
  const command = new commander.Command('config');

  command
    .description('Set value to a configuration key')
    .arguments('[key] [value]')
    .action((key: string, value: string) => {
      console.log(key, value);
    });

  return command;
};
