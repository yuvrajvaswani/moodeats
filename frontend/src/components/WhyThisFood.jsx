function WhyThisFood({ explanation }) {
  if (!explanation) {
    return null;
  }

  return <p className="food-meta why-text">Why this food? {explanation}</p>;
}

export default WhyThisFood;
