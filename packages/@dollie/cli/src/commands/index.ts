import ConfigCommand from './config.command';
import InitCommand from './init.command';
import OriginCommand from './origin.command';
import CacheCommand from './cache.command';
import CreateCommand from './create.command';

const commands = {
  config: ConfigCommand,
  init: InitCommand,
  origin: OriginCommand,
  cache: CacheCommand,
  create: CreateCommand,
};

export default commands;
