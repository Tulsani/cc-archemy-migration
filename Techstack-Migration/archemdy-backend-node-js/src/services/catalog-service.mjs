export class CatalogService {
  constructor(repository) {
    this.repository = repository;
  }

  domainName(domainId) {
    return this.repository.state.domains.find((domain) => domain.id === Number(domainId))?.name ?? 'Unknown';
  }

  searchAndRankKad(criteria = [], businessProblemId = null) {
    const scores = new Map();
    const activeCriteria = criteria.filter((item) => item.dimensionId && Number(item.weight) > 0);

    for (const link of this.repository.state.kadAreas) {
      const kad = this.repository.state.kads.find((item) => item.id === link.kadId);
      if (!kad || (businessProblemId && kad.businessProblemId !== Number(businessProblemId))) continue;

      for (const item of activeCriteria) {
        if (Number(item.dimensionId) !== link.dimensionId) continue;
        if (item.areaId && link.areaParentId !== Number(item.areaId) && link.areaId !== Number(item.areaId)) continue;
        if (item.areaChildId && link.areaId !== Number(item.areaChildId)) continue;
        scores.set(kad.id, (scores.get(kad.id) ?? 0) + Number(item.weight));
      }
    }

    const maxScore = Math.max(...Array.from(scores.values()), 1);
    return Array.from(scores.entries())
      .map(([kadId, score]) => {
        const kad = this.repository.state.kads.find((item) => item.id === kadId);
        return {
          ...kad,
          domainName: this.domainName(kad.domainId),
          score,
          relativeScore: Math.round((score / maxScore) * 100),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async addKad(input, criteria = []) {
    if (typeof this.repository.createKad === 'function') return this.repository.createKad(input, criteria);

    const id = this.repository.nextId('kads');
    const kad = {
      id,
      name: input.name,
      domainId: Number(input.domainId),
      link: input.link,
      publicLink: input.publicLink,
      hitCounter: 0,
      businessProblemId: Number(input.businessProblemId),
    };

    this.repository.state.kads.push(kad);
    for (const item of criteria.filter((row) => row.dimensionId)) {
      this.repository.state.kadAreas.push({
        kadId: id,
        dimensionId: Number(item.dimensionId),
        areaId: item.areaChildId ? Number(item.areaChildId) : item.areaId ? Number(item.areaId) : null,
        areaParentId: item.areaChildId ? Number(item.areaId) : 0,
      });
    }
    return structuredClone(kad);
  }

  async removeKad(kadId) {
    if (typeof this.repository.removeKad === 'function') return this.repository.removeKad(kadId);

    const id = Number(kadId);
    this.repository.state.kads = this.repository.state.kads.filter((kad) => kad.id !== id);
    this.repository.state.kadAreas = this.repository.state.kadAreas.filter((item) => item.kadId !== id);
    this.repository.state.registrations = this.repository.state.registrations.filter((item) => item.kadId !== id);
  }

  async incrementHitCount(kadId) {
    if (typeof this.repository.incrementKadHit === 'function') return this.repository.incrementKadHit(kadId);

    const kad = this.repository.state.kads.find((item) => item.id === Number(kadId));
    if (!kad) return null;
    kad.hitCounter += 1;
    return kad.hitCounter;
  }

  async addCustomerRowIfNotExists(userId) {
    if (!this.repository.state.customers.some((item) => item.userId === userId)) {
      const row = { userId, customerName: userId, industry: '' };
      if (typeof this.repository.upsert === 'function') await this.repository.upsert('customers', 'userId', row);
      else this.repository.state.customers.push(row);
    }
  }

  summaryForKad(kadId) {
    const rows = this.repository.state.registrations.filter((item) => item.kadId === Number(kadId));
    if (!rows.length) return [];
    return [
      {
        kadId: Number(kadId),
        deploymentStatus: mode(rows.map((row) => row.deploymentStatus)),
        applicabilityExtent: mode(rows.map((row) => row.applicabilityExtent)),
        avgBenefitRating: mode(rows.map((row) => row.benefitRating)),
        avgMaturityRating: mode(rows.map((row) => row.maturityRating)),
      },
    ];
  }
}

function mode(values) {
  return values.sort((a, b) => values.filter((value) => value === b).length - values.filter((value) => value === a).length)[0] ?? '';
}
