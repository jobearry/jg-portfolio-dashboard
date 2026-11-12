import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Pill } from '../../../../components/pill';

@Component({
  selector: 'app-certifications',
  imports: [Pill],
  templateUrl: './certifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class Certifications {}
