import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/shared-imports';

@Component({
  selector: 'app-loading-spinner',
  imports: [SHARED_IMPORTS],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss',
})
export class LoadingSpinner implements OnInit, OnDestroy {
  @ViewChildren('segment') segmentRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private readonly totalSegments = 18;
  private animationInterval: ReturnType<typeof setInterval> | null = null;
  private currentSegment = 0;

  readonly segments = Array.from({ length: this.totalSegments }, (_, i) => i);

  ngOnInit(): void {
    // Esperamos al siguiente ciclo para que @ViewChildren esté listo
    setTimeout(() => this.startAnimation());
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private startAnimation(): void {
    this.stopAnimation();

    const els = this.segmentRefs?.toArray() ?? [];
    if (els.length === 0) {
      return;
    }

    // Ensure currentSegment is within bounds
    this.currentSegment = this.currentSegment % els.length;
    const activate = (idx: number) => els[idx]?.nativeElement.classList.add('active');
    const deactivate = (idx: number) => els[idx]?.nativeElement.classList.remove('active');

    activate(this.currentSegment);

    this.animationInterval = setInterval(() => {
      deactivate(this.currentSegment);
      this.currentSegment = (this.currentSegment + 1) % els.length;
      activate(this.currentSegment);
    }, 200);
  }

  private stopAnimation(): void {
    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    this.segmentRefs?.forEach(ref => ref.nativeElement.classList.remove('active'));
    this.currentSegment = 0;
  }
}
