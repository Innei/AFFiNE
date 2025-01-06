import { Entity } from '@toeverything/infra';

export type TemplateDocSettings = {
  templateId?: string;
  journalTemplateId?: string;
};

export class TemplateDocSetting extends Entity {
  constructor() {
    super();
  }
}
