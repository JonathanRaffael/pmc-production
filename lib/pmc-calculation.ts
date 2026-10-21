// =====================================================
// PMC CALCULATION
// =====================================================

export interface PMCCalculationInput {
  outputQty: number;
  okQty: number;
  actualRm: number;
  shotWeight: number;
  target8H: number;
}

export interface PMCCalculationResult {
  ngQty: number;
  ngRate: number;

  rmRequirement: number;
  rmVariance: number;
  rmPercentage: number;

  productVariance: number;
  achievement: number;
}


// =====================================================
// CALCULATE PMC
// =====================================================

export function calculatePMC({
  outputQty,
  okQty,
  actualRm,
  shotWeight,
  target8H,
}: PMCCalculationInput): PMCCalculationResult {

  // ---------------------------------------------------
  // 1. TOTAL NG PRODUCT
  //
  // Output Production - Quantity Product OK
  // ---------------------------------------------------

  const ngQty = Math.max(
    outputQty - okQty,
    0
  );


  // ---------------------------------------------------
  // 2. PRODUCT RATE NG (%)
  //
  // MIN(NG / Output Production, 1) × 100
  // ---------------------------------------------------

  const ngRate =
    outputQty > 0
      ? Math.min(
          ngQty / outputQty,
          1
        ) * 100
      : 0;


  // ---------------------------------------------------
  // 3. RAW MATERIAL REQUIREMENT
  //
  // (Output Production × Shot Weight)
  // + (Shot Weight × 5)
  // ---------------------------------------------------

  const rmRequirement =
    (outputQty * shotWeight) +
    (shotWeight * 5);


  // ---------------------------------------------------
  // 4. VARIANCE RAW MATERIAL
  //
  // Total Actual Raw Material Usage
  // - Raw Material Requirement
  // ---------------------------------------------------

  const rmVariance =
    actualRm - rmRequirement;


  // ---------------------------------------------------
  // 5. RAW MATERIAL PERCENTAGE (%)
  //
  // Actual Raw Material Usage
  // / Raw Material Requirement × 100
  // ---------------------------------------------------

  const rmPercentage =
    rmRequirement > 0
      ? (actualRm / rmRequirement) * 100
      : 0;


  // ---------------------------------------------------
  // 6. VARIANCE PRODUCT
  //
  // Output Production
  // - Target Qty Production / 8H
  //
  // Positif  = Melebihi target
  // Negatif  = Di bawah target
  // ---------------------------------------------------

  const productVariance =
    outputQty - target8H;


  // ---------------------------------------------------
  // 7. ACHIEVEMENT (%)
  //
  // Output Production
  // / Target Qty Production / 8H × 100
  // ---------------------------------------------------

  const achievement =
    target8H > 0
      ? (outputQty / target8H) * 100
      : 0;


  // ---------------------------------------------------
  // RETURN
  // ---------------------------------------------------

  return {
    ngQty,
    ngRate,

    rmRequirement,
    rmVariance,
    rmPercentage,

    productVariance,
    achievement,
  };
}