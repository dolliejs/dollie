import ConfigCommand from './config.command';
import InitCommand from './init.command';
import OriginCommand from './origin.command';
import CacheCommand from './cache.command';
import _ from 'lodash';

const commands = {
  config: ConfigCommand,
  init: InitCommand,
  origin: OriginCommand,
  cache: CacheCommand,
};

export default commands;
