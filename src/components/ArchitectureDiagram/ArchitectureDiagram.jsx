import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ZONES, NODES, FLOWS, TRANSPORT, indexContracts } from '../../pages/PublicDocs/architecture';
import './ArchitectureDiagram.css';

/**
 * Interactive map of the deployed contracts and how they relate.
 *
 * Selecting a flow dims everything not involved and draws the path between the
 * contracts that are, which is the thing a table cannot show: not what exists,
 * but what talks to what, and over which transport.
 *
 * Arrows are drawn in SVG from positions measured off the rendered nodes rather
 * than from hardcoded coordinates. The predecessor used a fixed 1200x1400 canvas
 * with zoom buttons; measuring instead means the layout can reflow for narrow
 * screens and the arrows still land in the right place.
 */
export default function ArchitectureDiagram({ registry }) {
  const [activeFlowId, setActiveFlowId] = useState('overview');
  const [edges, setEdges] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef(null);
  const nodeRefs = useRef({});

  const contracts = indexContracts(registry);
  const activeFlow = FLOWS.find((flow) => flow.id === activeFlowId) ?? FLOWS[0];
  const involved = new Set(activeFlow.nodes);

  /**
   * Measure node centres and turn the flow's logical edges into drawable ones.
   * Runs after layout and on resize, because positions depend on reflow.
   */
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasBox = canvas.getBoundingClientRect();
    setCanvasSize({ width: canvasBox.width, height: canvas.scrollHeight });

    const centreOf = (id) => {
      const element = nodeRefs.current[id];
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        x: box.left - canvasBox.left + box.width / 2,
        y: box.top - canvasBox.top + canvas.scrollTop + box.height / 2,
        halfHeight: box.height / 2,
      };
    };

    const drawable = [];
    for (const edge of activeFlow.edges) {
      const from = centreOf(edge.from);
      const to = centreOf(edge.to);
      if (!from || !to) continue;
      drawable.push({ ...edge, from, to, key: `${edge.from}-${edge.to}-${edge.transport}` });
    }
    setEdges(drawable);
  }, [activeFlow]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    // Fonts landing late shift positions, so re-measure once they are ready.
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  return (
    <div className="ow-arch">
      <div className="ow-arch__flows" role="tablist" aria-label="Protocol flows">
        {FLOWS.map((flow) => (
          <button
            key={flow.id}
            type="button"
            role="tab"
            aria-selected={flow.id === activeFlowId}
            className={`ow-arch__flow${flow.id === activeFlowId ? ' is-active' : ''}`}
            onClick={() => setActiveFlowId(flow.id)}
          >
            {flow.label}
            {flow.badge && <span className="ow-arch__flow-badge">{flow.badge}</span>}
          </button>
        ))}
      </div>

      <div className="ow-arch__brief">
        <p className="ow-arch__summary">{activeFlow.summary}</p>
        {activeFlow.steps && (
          <ol className="ow-arch__steps">
            {activeFlow.steps.map((step, index) => (
              <li key={step}>
                <span className="ow-arch__step-index">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="ow-arch__legend">
        <span className="ow-arch__legend-item ow-arch__legend-item--message">LayerZero message</span>
        <span className="ow-arch__legend-item ow-arch__legend-item--usdc">USDC via Circle CCTP</span>
        <span className="ow-arch__legend-item ow-arch__legend-item--local">Same-chain call</span>
      </div>

      <div className="ow-arch__canvas" ref={canvasRef}>
        <svg
          className="ow-arch__wires"
          width={canvasSize.width || '100%'}
          height={canvasSize.height || '100%'}
          aria-hidden="true"
        >
          <defs>
            {[
              ['message', 'var(--ow-arch-message)'],
              ['usdc', 'var(--ow-arch-usdc)'],
              ['local', 'var(--ow-arch-local)'],
            ].map(([name, colour]) => (
              <marker
                key={name}
                id={`ow-arrow-${name}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={colour} />
              </marker>
            ))}
          </defs>

          {edges.map((edge) => {
            // Curve vertically between rows and horizontally across columns, so
            // a path never runs straight through an unrelated node.
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            const bend = Math.min(Math.abs(dy) / 2 + 24, 90);
            const path =
              Math.abs(dy) > Math.abs(dx)
                ? `M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${edge.from.y + bend}, ${edge.to.x} ${edge.to.y - bend}, ${edge.to.x} ${edge.to.y}`
                : `M ${edge.from.x} ${edge.from.y} C ${edge.from.x + dx / 2} ${edge.from.y}, ${edge.from.x + dx / 2} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`;

            return (
              <path
                key={edge.key}
                d={path}
                className={`ow-arch__wire ow-arch__wire--${edge.transport}`}
                markerEnd={`url(#ow-arrow-${edge.transport})`}
              />
            );
          })}
        </svg>

        {ZONES.map((zone) => (
          <section className="ow-arch__zone" key={zone.id}>
            <header className="ow-arch__zone-head">
              <h3>{zone.label}</h3>
              <p>{zone.note}</p>
            </header>

            <div className="ow-arch__columns">
              {zone.columns.map((column) => (
                <div className="ow-arch__column" key={column.id}>
                  <span className="ow-arch__column-label">{column.label}</span>
                  <div className="ow-arch__nodes">
                    {column.nodes.map((nodeId) => {
                      const node = NODES[nodeId];
                      if (!node) return null;
                      const contract = node.contractId ? contracts[node.contractId] : null;
                      const isInvolved = involved.has(nodeId);
                      const href = contract ? `${contract.explorer}${contract.address}` : null;

                      const classes = [
                        'ow-arch__node',
                        isInvolved ? 'is-involved' : 'is-dimmed',
                        node.emphasis ? 'is-emphasis' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      const body = (
                        <>
                          <img src={`/${node.icon}`} alt="" className="ow-arch__node-icon" />
                          <span className="ow-arch__node-label">{node.label}</span>
                          <span className="ow-arch__node-role">{node.role}</span>
                          {contract && (
                            <span className="ow-arch__node-address">
                              {contract.address.slice(0, 6)}…{contract.address.slice(-4)}
                            </span>
                          )}
                        </>
                      );

                      return (
                        <div
                          key={nodeId}
                          className={classes}
                          ref={(element) => {
                            nodeRefs.current[nodeId] = element;
                          }}
                        >
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" title={contract.name}>
                              {body}
                            </a>
                          ) : (
                            body
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export { TRANSPORT };
