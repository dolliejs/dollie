import chalk from 'chalk';
import _ from 'lodash';

class Logger {
  public constructor(
    private color: string,
    private backgroundColor: string,
    private level: string = 'INFO',
    private logger = console,
  ) {}

  public log(message: string): void {
    const currentTime = new Date().toLocaleString();

    const messageString = `${this.level ? ` - ${this.level.toUpperCase()} - ` : ''}` + message;
    let chalkedMessageString: string;

    if (!this.color) {
      chalkedMessageString = messageString;
    } else if (!_.isFunction(chalk[this.color])) {
      chalkedMessageString = messageString;
    } else {
      chalkedMessageString = chalk[this.color](messageString);
    }

    if (this.backgroundColor && _.isFunction(chalk[this.backgroundColor])) {
      chalkedMessageString = chalk[this.backgroundColor](chalkedMessageString);
    }

    this.logger.log(chalk.gray(currentTime) + chalkedMessageString);
  }
}

class InfoLogger extends Logger {
  public constructor() {
    super(null, null);
  }
}

class ErrorLogger extends Logger {
  public constructor() {
    super('red', null, 'ERROR');
  }
}

export {
  InfoLogger,
  ErrorLogger,
};
