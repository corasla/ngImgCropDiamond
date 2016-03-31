'use strict';

crop.factory('cropAreaDiamond', ['cropArea', function(CropArea) {
    var CropAreaDiamond = function() {
        CropArea.apply(this, arguments);

        this._resizeCtrlBaseRadius = 15;
        this._resizeCtrlNormalRatio = 0.75;
        this._resizeCtrlHoverRatio = 1;
        this._iconMoveNormalRatio = 0.9;
        this._iconMoveHoverRatio = 1.2;

        this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius * this._resizeCtrlNormalRatio;
        this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius * this._resizeCtrlHoverRatio;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
        this._posResizeStartX = 0;
        this._posResizeStartY = 0;
        this._posResizeStartSize = 0;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;
        this._resizeCtrlIsDragging = -1;
        this._areaIsDragging = false;
    };

    CropAreaDiamond.prototype = new CropArea();

    CropAreaDiamond.prototype.getType = function() {
        return 'diamond';
    };

    CropAreaDiamond.prototype._calcDiamondCorners = function() {
        var size = this.getSize(),
            se = this.getSouthEastBound();
            // ctx.moveTo(size.x + size.w / 2, size.y);
            // ctx.lineTo(size.x + size.w, size.y + size.h / 2);
            // ctx.lineTo(size.x + size.w / 2, size.y + size.h);
            // ctx.lineTo(size.x, size.y + size.h / 2);
        return [
            [size.x + size.w / 2, size.y], //northwest
            [size.x + size.w, size.y + size.h / 2], //northeast
            [size.x + size.w / 2, size.y + size.h], //southwest
            [size.x, size.y + size.h / 2] //southeast
        ];
        // return [
        //     [size.x, size.y], //northwest
        //     [se.x, size.y], //northeast
        //     [size.x, se.y], //southwest
        //     [se.x, se.y] //southeast
        // ];
    };

    CropAreaDiamond.prototype._calcDiamondDimensions = function() {
        var size = this.getSize(),
            se = this.getSouthEastBound();
        return {
            left: size.x,
            top: size.y,
            right: se.x,
            bottom: se.y
        };
    };

    CropAreaDiamond.prototype._isCoordWithinArea = function(coord) {
        var diamondDimensions = this._calcDiamondDimensions();
        return (coord[0] >= diamondDimensions.left && coord[0] <= diamondDimensions.right && coord[1] >= diamondDimensions.top && coord[1] <= diamondDimensions.bottom);
    };

    CropAreaDiamond.prototype._isCoordWithinResizeCtrl = function(coord) {
        var resizeIconsCenterCoords = this._calcDiamondCorners();
        var res = -1;
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            if (coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
                coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
                res = i;
                break;
            }
        }
        return res;
    };

    CropAreaDiamond.prototype._drawArea = function(ctx, centerCoords, size) {
        var hSize = size / 2;
        ctx.beginPath();
        ctx.moveTo(size.x + size.w / 2, size.y);
        ctx.lineTo(size.x + size.w, size.y + size.h / 2);
        ctx.lineTo(size.x + size.w / 2, size.y + size.h);
        ctx.lineTo(size.x, size.y + size.h / 2);
        ctx.lineTo(size.x + size.w / 2, size.y);
        ctx.closePath();
    };

    CropAreaDiamond.prototype.draw = function() {
        CropArea.prototype.draw.apply(this, arguments);

        // draw move icon
        var center = this.getCenterPoint();
        this._cropCanvas.drawIconMove([center.x, center.y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

        // draw resize cubes
        var resizeIconsCenterCoords = this._calcDiamondCorners();
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover === i ? this._resizeCtrlHoverRatio : this._resizeCtrlNormalRatio);
        }
    };

    CropAreaDiamond.prototype.processMouseMove = function(mouseCurX, mouseCurY) {
        var cursor = 'default';
        var res = false;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;

        if (this._areaIsDragging) {
            this.setCenterPointOnMove({
                x: mouseCurX - this._posDragStartX,
                y: mouseCurY - this._posDragStartY
            });
            this._areaIsHover = true;
            cursor = 'move';
            res = true;
            this._events.trigger('area-move');
        } else if (this._resizeCtrlIsDragging > -1) {
            var xMulti, yMulti;
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top
                    xMulti = 0;
                    yMulti = -1;
                    cursor = 'ns-resize';
                    break;
                case 1: // Right
                    xMulti = -1;
                    yMulti = 0;
                    cursor = 'ew-resize';
                    break;
                case 2: // Bottom
                    xMulti = 0;
                    yMulti = 1;
                    cursor = 'ns-resize';
                    break;
                case 3: // Left
                    xMulti = -1;
                    yMulti = 0;
                    cursor = 'ew-resize';
                    break;
            }
            var iFX = (mouseCurX - this._posResizeStartX) * xMulti,
                iFY = (mouseCurY - this._posResizeStartY) * yMulti,
                iFR;
            // if (iFX > iFY) {
                // iFR = this._posResizeStartSize.w + iFY;
            // } else {
                // iFR = this._posResizeStartSize.w + iFX;
            // }
            var typeOfCtrl = this._resizeCtrlIsDragging;
            if (typeOfCtrl === 0 || typeOfCtrl === 2) {
                iFR = this._posResizeStartSize.w + iFY;
            } else {
                iFR = this._posResizeStartSize.w + iFX;
            }

            console.info('IFX, iFY, iFR -> ', iFX, iFY, iFR);
            var newSize = Math.max(this._minSize.w, iFR),
                newNO = {},
                newEA = {},
                newSO = {},
                newWE = {},
                s = this.getSize(),
                se = this.getSouthEastBound();
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top
                    newNO.x = s.x;
                    newNO.y = se.y - newSize;
                    if(newNO.y > 0) {
                        this.setSizeByCorners(newNO, {
                            x: se.x,
                            y: se.y
                        });
                    }
                    cursor = 'ns-resize';
                    break;
                case 1: // Right
                    // if(iFX >= 0 && iFY >= 0) {
                        //Move to top/right, increase
                        // newEA.x = s.x + newSize;
                        // newEA.y = se.y;
                    // } else if(iFX < 0 || iFY < 0) {
                    // if(iFX < 0 || iFY < 0) {
                        //else decrease
                        newEA.x = se.x - newSize;
                        newEA.y = s.y;
                        console.info('newSize -> ', newSize);
                        console.info('newEA -> ', newEA);
                        console.info('se -> ', se);
                        console.info('s -> ', s);
                    // }
                    if(newEA.x > 0) {
                        this.setSizeByCorners(newEA, {
                            x: se.x,
                            y: se.y
                        });
                    }
                    cursor = 'ew-resize';
                    break;
                // case 2: // Bottom
                //     if(iFX >= 0 && iFY >= 0) {
                //         //Move to bottom/left, increase
                //         newSO.x = se.x - newSize;
                //         newSO.y = s.y + newSize;
                //     } else if(iFX <= 0 || iFY <= 0) {
                //         //else decrease
                //         newSO.x = se.x - newSize;
                //         newSO.y = s.y + newSize;
                //     }
                //     if(newSO.y < this._ctx.canvas.height) {
                //         this.setSizeByCorners({
                //             x: newSO.x,
                //             y: s.y
                //         }, {
                //             x: se.x,
                //             y: newSO.y
                //         });
                //     }
                //     cursor = 'ns-resize';
                //     break;
                // case 3: // Left
                //
                //     newSE.x = s.x + newSize;
                //     newSE.y = s.y + newSize;
                //
                //     if(newSE.y < this._ctx.canvas.height) {
                //         this.setSizeByCorners({
                //             x: s.x,
                //             y: s.y
                //         }, newSE);
                //     }
                //     cursor = 'ew-resize';
                //     break;
            }
            this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
            res = true;
            this._events.trigger('area-resize');
        } else {
            var hoveredResizeBox = this._isCoordWithinResizeCtrl([mouseCurX, mouseCurY]);
            if (hoveredResizeBox > -1) {
                switch (hoveredResizeBox) {
                    case 0:
                        cursor = 'ns-resize';
                        break;
                    case 1:
                        cursor = 'ew-resize';
                        break;
                    case 2:
                        cursor = 'ns-resize';
                        break;
                    case 3:
                        cursor = 'ew-resize';
                        break;
                }
                this._areaIsHover = false;
                this._resizeCtrlIsHover = hoveredResizeBox;
                res = true;
            } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
                cursor = 'move';
                this._areaIsHover = true;
                res = true;
            }
        }

        angular.element(this._ctx.canvas).css({
            'cursor': cursor
        });

        return res;
    };

    CropAreaDiamond.prototype.processMouseDown = function(mouseDownX, mouseDownY) {
        var isWithinResizeCtrl = this._isCoordWithinResizeCtrl([mouseDownX, mouseDownY]);
        if (isWithinResizeCtrl > -1) {
            this._areaIsDragging = false;
            this._areaIsHover = false;
            this._resizeCtrlIsDragging = isWithinResizeCtrl;
            this._resizeCtrlIsHover = isWithinResizeCtrl;
            this._posResizeStartX = mouseDownX;
            this._posResizeStartY = mouseDownY;
            this._posResizeStartSize = this._size;
            this._events.trigger('area-resize-start');
        } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
            this._areaIsDragging = true;
            this._areaIsHover = true;
            this._resizeCtrlIsDragging = -1;
            this._resizeCtrlIsHover = -1;
            var center = this.getCenterPoint();
            this._posDragStartX = mouseDownX - center.x;
            this._posDragStartY = mouseDownY - center.y;
            this._events.trigger('area-move-start');
        }
    };

    CropAreaDiamond.prototype.processMouseUp = function( /*mouseUpX, mouseUpY*/ ) {
        if (this._areaIsDragging) {
            this._areaIsDragging = false;
            this._events.trigger('area-move-end');
        }
        if (this._resizeCtrlIsDragging > -1) {
            this._resizeCtrlIsDragging = -1;
            this._events.trigger('area-resize-end');
        }
        this._areaIsHover = false;
        this._resizeCtrlIsHover = -1;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
    };


    return CropAreaDiamond;
}]);
