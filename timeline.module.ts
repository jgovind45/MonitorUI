import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineComponent } from './timeline.component';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../shared/shared.module';

const routes = [
    {
        path     : '',
        component: TimelineComponent
    }
];

@NgModule({
    declarations: [
        TimelineComponent
    ],
  imports: [
    CommonModule,
      SharedModule,
      RouterModule.forChild(routes),
  ]
})
export class TimelineModule { }
