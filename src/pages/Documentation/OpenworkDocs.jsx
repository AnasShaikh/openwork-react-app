import React, { useState, useMemo } from 'react';
import { FileText, Code, TestTube, Play, Database, History, ArrowRight, Edit2, Rocket, ChevronDown, ChevronRight, MessageSquare, Send, X, Copy, Check } from 'lucide-react';
import './OpenworkDocs.css';
import { contractsData } from './data/contracts';
import { ipfsData } from './data/ipfsData';
import { columnPositions, statusColors } from './data/columnPositions';
import { arrowConnections } from './data/arrowConnections';

const OpenworkDocs = () => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [activeTab, setActiveTab] = useState('docs');
  const [editingStatus, setEditingStatus] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [oppyMessage, setOppyMessage] = useState('');
  const [oppyChat, setOppyChat] = useState([
    { role: 'oppy', text: 'Hi! I\'m Agent Oppy, your OpenWork assistant. Ask me anything about the protocol, contracts, or how to get started!' }
  ]);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Auto-layout: Calculate x,y positions from column and order
  const contracts = useMemo(() => {
    const startY = 240;
    const verticalGap = 110;
    
    const positioned = {};
    Object.entries(contractsData).forEach(([key, contract]) => {
      positioned[key] = {
        ...contract,
        x: columnPositions[contract.column],
        y: startY + (contract.order * verticalGap)
      };
    });
    
    return positioned;
  }, []);

  const selected = selectedContract && selectedContract !== 'ipfs' && selectedContract !== 'oppy' ? contracts[selectedContract] : null;

  // Generate arrow paths
  const generateArrowPath = (fromId, toId, routeType = 'direct') => {
    const from = contracts[fromId];
    const to = contracts[toId];
    
    if (!from || !to) return null;
    
    const cardWidth = 130;
    const cardHeight = 80;
    const arrowMarkerWidth = 10; // Width of arrow marker + buffer for stroke
    
    // Calculate connection points, adjusted for arrow marker size
    const fromX = from.x + cardWidth + arrowMarkerWidth; // Right edge of 'from' card plus arrow width
    const fromY = from.y + cardHeight / 2; // Vertical center
    const toX = to.x - arrowMarkerWidth; // Left edge of 'to' card minus arrow width
    const toY = to.y + cardHeight / 2; // Vertical center
    
    // For direct routing (no obstacles)
    if (routeType === 'direct') {
      const controlPointOffset = Math.abs(toX - fromX) * 0.5;
      const controlPoint1X = fromX + controlPointOffset;
      const controlPoint2X = toX - controlPointOffset;
      
      return {
        path: `M ${fromX} ${fromY} C ${controlPoint1X} ${fromY}, ${controlPoint2X} ${toY}, ${toX} ${toY}`,
        fromX,
        fromY,
        toX,
        toY
      };
    }
    
    // For routing around obstacles
    const midX = (fromX + toX) / 2;
    const verticalOffset = 120; // How far to route above/below
    
    if (routeType === 'above') {
      // Route above: go up, across, then down
      const waypoint1Y = Math.min(fromY, toY) - verticalOffset;
      const waypoint2Y = waypoint1Y;
      
      // Create smooth S-curve with waypoints
      const controlOffset1 = 80;
      const controlOffset2 = 80;
      
      return {
        path: `M ${fromX} ${fromY} 
               C ${fromX + controlOffset1} ${fromY}, ${fromX + controlOffset1} ${waypoint1Y}, ${midX - 50} ${waypoint1Y}
               C ${midX + 50} ${waypoint2Y}, ${toX - controlOffset2} ${waypoint2Y}, ${toX - controlOffset2} ${toY}
               C ${toX - controlOffset2} ${toY}, ${toX} ${toY}, ${toX} ${toY}`,
        fromX,
        fromY,
        toX,
        toY
      };
    } else if (routeType === 'below') {
      // Route below: go down, across, then up
      const waypoint1Y = Math.max(fromY, toY) + verticalOffset;
      const waypoint2Y = waypoint1Y;
      
      const controlOffset1 = 80;
      const controlOffset2 = 80;
      
      return {
        path: `M ${fromX} ${fromY}
               C ${fromX + controlOffset1} ${fromY}, ${fromX + controlOffset1} ${waypoint1Y}, ${midX - 50} ${waypoint1Y}
               C ${midX + 50} ${waypoint2Y}, ${toX - controlOffset2} ${waypoint2Y}, ${toX - controlOffset2} ${toY}
               C ${toX - controlOffset2} ${toY}, ${toX} ${toY}, ${toX} ${toY}`,
        fromX,
        fromY,
        toX,
        toY
      };
    }
    
    // Fallback to direct
    return {
      path: `M ${fromX} ${fromY} L ${toX} ${toY}`,
      fromX,
      fromY,
      toX,
      toY
    };
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const contractsByChain = useMemo(() => {
    const base = Object.values(contracts).filter(c => c.chain === 'base');
    const l2 = Object.values(contracts).filter(c => c.chain === 'l2');
    const op = Object.values(contracts).filter(c => c.chain === 'op');
    const eth = Object.values(contracts).filter(c => c.chain === 'eth');
    
    const getBounds = (contractList) => {
      if (contractList.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
      const padding = 30;
      const contractWidth = 130;
      const contractHeight = 80;
      
      const minX = Math.min(...contractList.map(c => c.x)) - padding;
      const minY = Math.min(...contractList.map(c => c.y)) - padding;
      const maxX = Math.max(...contractList.map(c => c.x)) + contractWidth + padding;
      const maxY = Math.max(...contractList.map(c => c.y)) + contractHeight + padding;
      
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    };
    
    return {
      base: { contracts: base, bounds: getBounds(base) },
      l2: { contracts: l2, bounds: getBounds(l2) },
      op: { contracts: op, bounds: getBounds(op) },
      eth: { contracts: eth, bounds: getBounds(eth) }
    };
  }, [contracts]);

  const handleOppySubmit = (e) => {
    e.preventDefault();
    if (!oppyMessage.trim()) return;

    const userMsg = oppyMessage;
    setOppyChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setOppyMessage('');

    setTimeout(() => {
      let response = '';
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes('athena') || lowerMsg.includes('dispute')) {
        response = 'Athena is our AI-powered dispute resolution contract. It uses oracle member votes to resolve disputes fairly. Disputes require a minimum $50 fee and are voted on by verified skill oracle members.';
      } else if (lowerMsg.includes('job') || lowerMsg.includes('escrow')) {
        response = 'The Job Registry manages all jobs on OpenWork. When a job is posted, payment is locked in escrow. Once both parties agree the work is complete, payment is automatically released.';
      } else if (lowerMsg.includes('bridge') || lowerMsg.includes('cctp')) {
        response = 'We use Circle\'s CCTP (Cross-Chain Transfer Protocol) to bridge USDC between Base L2 and other chains like Arbitrum and Polygon. The LayerZero bridge handles governance messages between Ethereum and Base.';
      } else if (lowerMsg.includes('ipfs')) {
        response = 'IPFS stores all job descriptions, submission proofs, and dispute evidence in a decentralized way. This ensures transparency and immutability of all work records.';
      } else if (lowerMsg.includes('deploy') || lowerMsg.includes('start')) {
        response = 'To deploy a contract, select it from the sidebar, go to the Deploy tab, choose your network (mainnet or testnet), and click Deploy. Make sure your wallet is connected!';
      } else if (lowerMsg.includes('token') || lowerMsg.includes('work')) {
        response = 'The WORK token is our ERC-20 governance token on Ethereum. Token holders can create proposals, vote on changes, and earn rewards for contributing to the protocol.';
      } else {
        response = 'I can help you understand OpenWork contracts, bridges, IPFS integration, or how to deploy. What would you like to know more about?';
      }
      
      setOppyChat(prev => [...prev, { role: 'oppy', text: response }]);
    }, 500);
  };

  return (
    <div className="docs-container">
      <div className="docs-sidebar">
        <div className="docs-sidebar-content">
          <div>
            <div 
              onClick={() => {
                setSelectedContract('oppy');
                setActiveTab('docs');
              }}
              className={`docs-sidebar-item docs-sidebar-item-oppy ${selectedContract === 'oppy' ? 'docs-sidebar-item-oppy-active' : ''}`}
            >
              <div className="docs-sidebar-item-content">
                <MessageSquare className="docs-sidebar-item-icon" />
                <span className="docs-sidebar-item-text">Agent Oppy</span>
              </div>
            </div>
          </div>

          <div className="docs-sidebar-section">
            <h3 className="docs-sidebar-section-title">Base Sepolia (Main Chain)</h3>
            {contractsByChain.base.contracts.map(c => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedContract(c.id);
                  setActiveTab('docs');
                }}
                className={`docs-sidebar-item ${selectedContract === c.id ? 'docs-sidebar-item-active' : ''}`}
              >
                {c.name}
              </div>
            ))}
          </div>

          <div className="docs-sidebar-section">
            <h3 className="docs-sidebar-section-title">Arbitrum Sepolia (Native Chain)</h3>
            {contractsByChain.l2.contracts.map(c => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedContract(c.id);
                  setActiveTab('docs');
                }}
                className={`docs-sidebar-item ${selectedContract === c.id ? 'docs-sidebar-item-active' : ''}`}
              >
                {c.name}
              </div>
            ))}
          </div>

          <div className="docs-sidebar-section">
            <h3 className="docs-sidebar-section-title">OP Sepolia</h3>
            {contractsByChain.op.contracts.map(c => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedContract(c.id);
                  setActiveTab('docs');
                }}
                className={`docs-sidebar-item ${selectedContract === c.id ? 'docs-sidebar-item-active' : ''}`}
              >
                {c.name}
              </div>
            ))}
          </div>

          <div className="docs-sidebar-section">
            <h3 className="docs-sidebar-section-title">Ethereum Sepolia</h3>
            {contractsByChain.eth.contracts.map(c => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedContract(c.id);
                  setActiveTab('docs');
                }}
                className={`docs-sidebar-item ${selectedContract === c.id ? 'docs-sidebar-item-active' : ''}`}
              >
                {c.name}
              </div>
            ))}
          </div>

          <div>
            <div 
              onClick={() => {
                setSelectedContract('ipfs');
                setActiveTab('docs');
              }}
              className={`docs-sidebar-item docs-sidebar-item-ipfs ${selectedContract === 'ipfs' ? 'docs-sidebar-item-ipfs-active' : ''}`}
            >
              <div className="docs-sidebar-item-content">
                <Database className="docs-sidebar-item-icon" />
                IPFS Storage
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="docs-canvas">
        <div className="docs-canvas-gradient"></div>
        
        {/* SVG Arrow Layer */}
        <svg className="docs-svg-canvas">
          <defs>
            {/* Arrow marker for end of path */}
            <marker
              id="arrowhead-end"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L0,10 L10,5 z" fill="#9333ea" />
            </marker>
            {/* Arrow marker for start of path (bidirectional) */}
            <marker
              id="arrowhead-start"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M10,0 L10,10 L0,5 z" fill="#9333ea" />
            </marker>
          </defs>
          
          {/* Render arrows */}
          {arrowConnections.map((connection) => {
            const arrowData = generateArrowPath(connection.from, connection.to, connection.routeType || 'direct');
            if (!arrowData) return null;
            
            return (
              <g key={connection.id}>
                {/* Arrow path */}
                <path
                  d={arrowData.path}
                  stroke={connection.color}
                  strokeWidth="2"
                  fill="none"
                  markerEnd={connection.type === 'bidirectional' || connection.type === 'forward' ? 'url(#arrowhead-end)' : ''}
                  markerStart={connection.type === 'bidirectional' ? 'url(#arrowhead-start)' : ''}
                  opacity="0.7"
                />
                {/* Optional label */}
                {connection.label && (
                  <text
                    x={(arrowData.fromX + arrowData.toX) / 2}
                    y={(arrowData.fromY + arrowData.toY) / 2 - 10}
                    fill={connection.color}
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {connection.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        <div 
          className="docs-ipfs-card" 
          style={{ left: 50, top: 50, width: 140 }}
          onClick={() => {
            setSelectedContract('ipfs');
            setActiveTab('docs');
          }}
        >
          <div className="docs-ipfs-card-header">
            <Database className="docs-ipfs-card-icon" />
            IPFS
          </div>
          <div className="docs-ipfs-card-content">
            <div className="docs-ipfs-card-item">Job Descriptions</div>
            <div className="docs-ipfs-card-item">Submissions</div>
            <div className="docs-ipfs-card-item">Evidence</div>
          </div>
        </div>

        {contractsByChain.base.bounds.width > 0 && (
          <>
            <div 
              className="docs-network-zone" 
              style={{ 
                left: contractsByChain.base.bounds.minX, 
                top: contractsByChain.base.bounds.minY, 
                width: contractsByChain.base.bounds.width, 
                height: contractsByChain.base.bounds.height 
              }}
            ></div>
            <div 
              className="docs-network-label" 
              style={{ left: contractsByChain.base.bounds.minX + 10, top: contractsByChain.base.bounds.minY - 25 }}
            >
              Base Sepolia (Main Chain)
            </div>
          </>
        )}

        {contractsByChain.l2.bounds.width > 0 && (
          <>
            <div 
              className="docs-network-zone docs-network-zone-l2" 
              style={{ 
                left: contractsByChain.l2.bounds.minX, 
                top: contractsByChain.l2.bounds.minY, 
                width: contractsByChain.l2.bounds.width, 
                height: contractsByChain.l2.bounds.height 
              }}
            ></div>
            <div 
              className="docs-network-label" 
              style={{ left: contractsByChain.l2.bounds.minX + 10, top: contractsByChain.l2.bounds.minY - 25 }}
            >
              Arbitrum Sepolia (Native Chain)
            </div>
          </>
        )}

        {contractsByChain.op.bounds.width > 0 && (
          <>
            <div 
              className="docs-network-zone docs-network-zone-user" 
              style={{ 
                left: contractsByChain.op.bounds.minX, 
                top: contractsByChain.op.bounds.minY, 
                width: contractsByChain.op.bounds.width, 
                height: contractsByChain.op.bounds.height 
              }}
            ></div>
            <div 
              className="docs-network-label" 
              style={{ left: contractsByChain.op.bounds.minX + 10, top: contractsByChain.op.bounds.minY - 25 }}
            >
              OP Sepolia
            </div>
          </>
        )}

        {contractsByChain.eth.bounds.width > 0 && (
          <>
            <div 
              className="docs-network-zone docs-network-zone-user" 
              style={{ 
                left: contractsByChain.eth.bounds.minX, 
                top: contractsByChain.eth.bounds.minY, 
                width: contractsByChain.eth.bounds.width, 
                height: contractsByChain.eth.bounds.height 
              }}
            ></div>
            <div 
              className="docs-network-label" 
              style={{ left: contractsByChain.eth.bounds.minX + 10, top: contractsByChain.eth.bounds.minY - 25 }}
            >
              Ethereum Sepolia
            </div>
          </>
        )}

        {Object.values(contracts).map(c => (
          <div
            key={c.id}
            onClick={() => {
              setSelectedContract(c.id);
              setActiveTab('docs');
            }}
            className={`docs-contract-card ${selectedContract === c.id ? 'docs-contract-card-active' : ''}`}
            style={{ left: c.x, top: c.y, width: 130 }}
          >
            <div className="docs-contract-card-header">
              <span className="docs-contract-card-name">{c.name}</span>
              <div className={`docs-contract-status ${statusColors[c.status]}`}></div>
            </div>
            <div className="docs-contract-card-version">{c.version}</div>
            <div className="docs-contract-card-gas">Gas: {c.gas}</div>
          </div>
        ))}
      </div>

      {(selected || selectedContract === 'ipfs' || selectedContract === 'oppy') && (
        <div className="docs-details-panel">
          <button
            onClick={() => {
              setSelectedContract(null);
            }}
            className="docs-details-close-button"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
          <div className="docs-details-header">
            {selectedContract === 'oppy' && (
              <>
                <div className="docs-details-header-oppy">
                  <MessageSquare className="docs-details-header-icon" />
                  <h2 className="docs-details-title">Agent Oppy</h2>
                </div>
                <p className="docs-details-subtitle">Your OpenWork assistant</p>
              </>
            )}

            {selected && (
              <>
                <div className="docs-details-title-row">
                  <h2 className="docs-details-title">{selected.name}</h2>
                  <button
                    onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                    className="docs-network-toggle-button"
                  >
                    {showNetworkDetails ? 'Hide Details' : 'Show Network Details'}
                    {showNetworkDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                <p className="docs-details-description">{selected.docs}</p>
                
                {showNetworkDetails && <div className="docs-network-cards">
                  <div className="docs-network-card">
                    <div className="docs-network-card-header">
                      <div className="docs-network-card-indicator"></div>
                      <span className="docs-network-card-label">Mainnet</span>
                    </div>
                    <div className="docs-network-card-name">{selected.mainnetNetwork}</div>
                    <div className="docs-network-card-deployed">Deployed: {selected.mainnetDeployed}</div>
                    {selected.mainnetAddress && (
                      <div className="docs-network-card-address">
                        {selected.mainnetAddress}
                      </div>
                    )}
                  </div>

                  <div className="docs-network-card">
                    <div className="docs-network-card-header">
                      <div className="docs-network-card-indicator docs-network-card-indicator-testnet"></div>
                      <span className="docs-network-card-label">Testnet{selected.isUUPS ? ' (UUPS Proxy)' : ''}</span>
                    </div>
                    <div className="docs-network-card-name">{selected.testnetNetwork}</div>
                    <div className="docs-network-card-deployed">Deployed: {selected.testnetDeployed}</div>
                    {selected.testnetAddress && (
                      <>
                        <div className="docs-network-card-address">
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                            {selected.isUUPS ? 'Proxy Address:' : 'Contract Address:'}
                          </div>
                          {selected.testnetAddress}
                        </div>
                        {selected.isUUPS && selected.implementationAddress && (
                          <div className="docs-network-card-address" style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                              Implementation:
                            </div>
                            {selected.implementationAddress}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>}
              </>
            )}

            {selectedContract === 'ipfs' && (
              <>
                <h2 className="docs-details-title">IPFS Storage</h2>
                <p className="docs-details-description">{ipfsData.docs}</p>
                
                <div className="docs-ipfs-details">
                  <div className="docs-ipfs-details-header">
                    <Database className="docs-ipfs-details-icon" />
                    <span className="docs-ipfs-details-label">IPFS Gateway</span>
                  </div>
                  <div className="docs-ipfs-details-gateway">
                    {ipfsData.gateway}
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedContract === 'oppy' ? (
            <div className="docs-chat-container">
              <div className="docs-chat-messages">
                {oppyChat.map((msg, idx) => (
                  <div key={idx} className={`docs-chat-message ${msg.role === 'user' ? 'docs-chat-message-user' : 'docs-chat-message-oppy'}`}>
                    <div className={`docs-chat-bubble ${msg.role === 'user' ? 'docs-chat-bubble-user' : 'docs-chat-bubble-oppy'}`}>
                      {msg.role === 'oppy' && (
                        <div className="docs-chat-bubble-header">
                          <MessageSquare className="docs-chat-bubble-icon" />
                          <span className="docs-chat-bubble-name">Oppy</span>
                        </div>
                      )}
                      <p className="docs-chat-bubble-text">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="docs-chat-input-container">
                <form onSubmit={handleOppySubmit} className="docs-chat-form">
                  <input
                    type="text"
                    value={oppyMessage}
                    onChange={(e) => setOppyMessage(e.target.value)}
                    placeholder="Ask me anything about OpenWork..."
                    className="docs-chat-input"
                  />
                  <button
                    type="submit"
                    className="docs-chat-submit"
                  >
                    <Send className="docs-chat-submit-icon" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div className="docs-tabs">
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`docs-tab ${activeTab === 'docs' ? 'docs-tab-active' : ''}`}
                >
                  Documentation
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`docs-tab ${activeTab === 'code' ? 'docs-tab-active' : ''}`}
                >
                  Code
                </button>
                {selected && (
                  <button
                    onClick={() => setActiveTab('deploy')}
                    className={`docs-tab ${activeTab === 'deploy' ? 'docs-tab-active' : ''}`}
                  >
                    Deploy
                  </button>
                )}
              </div>

              <div className="docs-tab-content">
                {activeTab === 'docs' && selectedContract === 'ipfs' && (
                  <div>
                    <div className="docs-prose">
                      <p>{ipfsData.docs}</p>
                    </div>
                    
                    <div className="docs-examples-section">
                      <h3 className="docs-examples-title">Usage Examples</h3>
                      {ipfsData.examples.map((example, idx) => (
                        <div key={idx} className="docs-example-item">
                          <button
                            onClick={() => toggleSection(`ipfs-${idx}`)}
                            className="docs-example-button"
                          >
                            <span className="docs-example-button-title">{example.title}</span>
                            {expandedSections[`ipfs-${idx}`] ? <ChevronDown className="docs-example-button-icon" /> : <ChevronRight className="docs-example-button-icon" />}
                          </button>
                          {expandedSections[`ipfs-${idx}`] && (
                            <div className="docs-example-content">
                              <p className="docs-example-description">{example.description}</p>
                              <pre className="docs-example-code">
                                <code>{example.code}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'docs' && selected && (
                  <div className="docs-comprehensive">
                    {/* Brief Description */}
                    <div className="docs-section">
                      <p className="docs-brief-description">{selected.docs}</p>
                    </div>

                    {/* Overview Section */}
                    {selected.overview && (
                      <div className="docs-section">
                        <h3 className="docs-section-title">📋 Overview</h3>
                        <div className="docs-section-content">
                          <p className="docs-overview-purpose">{selected.overview.purpose}</p>
                          <div className="docs-meta-grid">
                            <div className="docs-meta-item">
                              <span className="docs-meta-label">Tier:</span>
                              <span className="docs-meta-value">{selected.overview.tier}</span>
                            </div>
                            <div className="docs-meta-item">
                              <span className="docs-meta-label">Category:</span>
                              <span className="docs-meta-value">{selected.overview.category}</span>
                            </div>
                            <div className="docs-meta-item">
                              <span className="docs-meta-label">Upgradeability:</span>
                              <span className="docs-meta-value">{selected.overview.upgradeability}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Features Section */}
                    {selected.features && (
                      <div className="docs-section">
                        <h3 className="docs-section-title">✨ Key Features</h3>
                        <ul className="docs-feature-list">
                          {selected.features.map((feature, idx) => (
                            <li key={idx} className="docs-feature-item">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* System Position Section */}
                    {selected.systemPosition && (
                      <div className="docs-section">
                        <h3 className="docs-section-title">🏗️ System Architecture</h3>
                        <div className="docs-section-content">
                          <p className="docs-architecture-description">{selected.systemPosition.description}</p>
                          <pre className="docs-diagram">
                            <code>{selected.systemPosition.diagram}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Dependencies Section */}
                    {selected.dependencies && (
                      <div className="docs-section">
                        <h3 className="docs-section-title">🔗 Dependencies & Prerequisites</h3>
                        <div className="docs-dependencies-container">
                          <div className="docs-dependency-column">
                            <h4 className="docs-dependency-subtitle">Depends On</h4>
                            {selected.dependencies.dependsOn.map((dep, idx) => (
                              <div key={idx} className="docs-dependency-card">
                                <div className="docs-dependency-header">
                                  <span className="docs-dependency-name">{dep.name}</span>
                                  <span className="docs-dependency-badge">{dep.type}</span>
                                </div>
                                <p className="docs-dependency-reason">{dep.reason}</p>
                              </div>
                            ))}
                          </div>
                          <div className="docs-dependency-column">
                            <h4 className="docs-dependency-subtitle">Required By</h4>
                            {selected.dependencies.requiredBy.map((dep, idx) => (
                              <div key={idx} className="docs-dependency-card">
                                <div className="docs-dependency-header">
                                  <span className="docs-dependency-name">{dep.name}</span>
                                  <span className="docs-dependency-badge">{dep.type}</span>
                                </div>
                                <p className="docs-dependency-reason">{dep.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="docs-prerequisites">
                          <h4 className="docs-dependency-subtitle">Prerequisites</h4>
                          <ul className="docs-prerequisites-list">
                            {selected.dependencies.prerequisites.map((prereq, idx) => (
                              <li key={idx} className="docs-prerequisite-item">{prereq}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Core Functions Section */}
                    {selected.functions && (
                      <div className="docs-section">
                        <h3 className="docs-section-title">⚡ Core Functions</h3>
                        {selected.functions.map((category, catIdx) => (
                          <div key={catIdx} className="docs-function-category">
                            <div className="docs-function-category-header">
                              <h4 className="docs-function-category-title">{category.category}</h4>
                              <p className="docs-function-category-description">{category.description}</p>
                            </div>
                            {category.items.map((fn, fnIdx) => {
                              const sectionKey = `fn-${catIdx}-${fnIdx}`;
                              return (
                                <div key={fnIdx} className="docs-function-item">
                                  <button
                                    onClick={() => toggleSection(sectionKey)}
                                    className="docs-function-toggle"
                                  >
                                    <span className="docs-function-name">{fn.name}()</span>
                                    {expandedSections[sectionKey] ? 
                                      <ChevronDown className="docs-function-icon" /> : 
                                      <ChevronRight className="docs-function-icon" />
                                    }
                                  </button>
                                  
                                  {expandedSections[sectionKey] && (
                                    <div className="docs-function-content">
                                      <div className="docs-function-signature">
                                        <code>{fn.signature}</code>
                                      </div>
                                      
                                      <div className="docs-function-section">
                                        <h5 className="docs-function-section-title">What it does:</h5>
                                        <p className="docs-function-text">{fn.whatItDoes}</p>
                                      </div>
                                      
                                      <div className="docs-function-section">
                                        <h5 className="docs-function-section-title">Why you'd use it:</h5>
                                        <p className="docs-function-text">{fn.whyUse}</p>
                                      </div>
                                      
                                      <div className="docs-function-section">
                                        <h5 className="docs-function-section-title">How it works:</h5>
                                        <ol className="docs-function-steps">
                                          {fn.howItWorks.map((step, stepIdx) => (
                                            <li key={stepIdx} className="docs-function-step">{step}</li>
                                          ))}
                                        </ol>
                                      </div>
                                      
                                      <div className="docs-function-section">
                                        <h5 className="docs-function-section-title">Parameters:</h5>
                                        <div className="docs-params-list">
                                          {fn.parameters.map((param, paramIdx) => (
                                            <div key={paramIdx} className="docs-param-item">
                                              <div className="docs-param-header">
                                                <code className="docs-param-name">{param.name}</code>
                                                <span className="docs-param-type">{param.type}</span>
                                              </div>
                                              <p className="docs-param-description">{param.description}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="docs-code-tab">
                    {selected && selected.code ? (
                      <div>
                        <div className="docs-code-header">
                          <h3 className="docs-code-section-title">
                            {selected.isUUPS ? 'Implementation Contract' : 'Contract Code'}
                          </h3>
                          <button
                            onClick={() => handleCopyCode(selected.code, 'main')}
                            className="docs-copy-button"
                          >
                            {copiedCode === 'main' ? (
                              <>
                                <Check size={16} />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="docs-code-block">
                          <code>{selected.code}</code>
                        </pre>
                        
                        {selected.isUUPS && selected.proxyCode && (
                          <>
                            <div className="docs-code-header" style={{ marginTop: '2rem' }}>
                              <h3 className="docs-code-section-title">
                                Proxy Contract
                              </h3>
                              <button
                                onClick={() => handleCopyCode(selected.proxyCode, 'proxy')}
                                className="docs-copy-button"
                              >
                                {copiedCode === 'proxy' ? (
                                  <>
                                    <Check size={16} />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={16} />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="docs-code-block">
                              <code>{selected.proxyCode}</code>
                            </pre>
                          </>
                        )}
                      </div>
                    ) : selectedContract === 'ipfs' ? (
                      <p>IPFS integration code examples coming soon...</p>
                    ) : (
                      <p>Contract code will be added soon...</p>
                    )}
                  </div>
                )}

                {activeTab === 'deploy' && selected && (
                  <div className="docs-deploy-tab">
                    <p>Deployment interface coming soon...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OpenworkDocs;
